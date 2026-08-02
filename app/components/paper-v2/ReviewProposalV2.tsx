import { ApaReferencesPanel } from "#app/components/paper-v2/ApaReferencesPanel";
import { FrameworkDiagramPanel } from "#app/components/paper-v2/FrameworkDiagramPanel";
import { ProposalAccordion } from "#app/components/paper-v2/ProposalAccordion";
import { ProposalExportPanel } from "#app/components/paper-v2/ProposalExportPanel";
import { ProposalReadinessPanel } from "#app/components/paper-v2/ProposalReadinessPanel";
import { ReviewTabBar } from "#app/components/paper-v2/ReviewTabBar";
import type { ReviewProposalTab } from "#app/components/paper-v2/types";
import type { loader as rootLoader } from "#app/root";
import type { IntegritySection, LibraryEntry } from "#app/services/library.server";
import type { Framework } from "#app/services/framework.server";
import type { ProposalSections } from "#app/services/proposal-assembly.server";
import type { GeneratedDocument } from "#app/services/paper.server";
import type { ProjectMetadataIssue } from "#app/utils/project-metadata-export";
import { computeProposalReadiness } from "#app/utils/proposal-readiness";
import { Badge, Button, Checkbox, Group, Text } from "@mantine/core";
import { Form, useRouteLoaderData } from "@remix-run/react";
import * as Ably from "ably";
import type { Message } from "ably";
import { useCallback, useEffect, useRef, useState } from "react";

import classes from "./review-proposal-v2.module.css";

type ReviewProposalV2Props = {
  paperId: string;
  paperTitle: string;
  abstractBody?: string;
  sections: ProposalSections;
  libraryEntries: LibraryEntry[];
  framework: Framework | null;
  integrity: {
    overall: string;
    sections: IntegritySection[];
  };
  generatedDocuments: GeneratedDocument[];
  timeZone: string;
  exportAllowed: boolean;
  exportOverride: boolean;
  onExportOverride: (v: boolean) => void;
  metadataIssues: ProjectMetadataIssue[];
  metadataOverride: boolean;
  onMetadataOverride: (v: boolean) => void;
  exportPptx: boolean;
  hasActiveSubscription: boolean;
  exportLimitRemaining?: number;
  unlimitedExport?: boolean;
  watermarkExports?: boolean;
  isPending: boolean;
  actionMessage?: string | null;
  onSaveSection: (key: string, content: string) => void;
  onRegenerateSection: (key: string, ablyEventName: string) => void;
  savingKey?: string | null;
};

export function ReviewProposalV2({
  paperId,
  paperTitle,
  abstractBody,
  sections: initialSections,
  libraryEntries,
  framework,
  integrity,
  generatedDocuments,
  timeZone,
  exportAllowed,
  exportOverride,
  onExportOverride,
  metadataIssues,
  metadataOverride,
  onMetadataOverride,
  exportPptx,
  hasActiveSubscription,
  exportLimitRemaining,
  unlimitedExport,
  watermarkExports,
  isPending,
  actionMessage,
  onSaveSection,
  onRegenerateSection,
  savingKey,
}: ReviewProposalV2Props) {
  const [tab, setTab] = useState<ReviewProposalTab>("preview");
  const [sections, setSections] = useState(initialSections);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const streamRef = useRef("");
  const benefitsPhaseRef = useRef<"practical" | "research" | null>(null);
  const regeneratingKeyRef = useRef<string | null>(null);
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const ablyKey = rootData?.ablyKey;

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  useEffect(() => {
    regeneratingKeyRef.current = regeneratingKey;
  }, [regeneratingKey]);

  const readiness = computeProposalReadiness(sections);
  const integrityBlocked = integrity.overall !== "pass";

  const handleAblyMessage = useCallback(
    (message: Message) => {
      const key = regeneratingKeyRef.current;
      if (!key) return;

      const data = String(message.data);
      if (data === "[DONE]") {
        if (key === "benefits" && benefitsPhaseRef.current === "practical") {
          benefitsPhaseRef.current = "research";
          streamRef.current += "\n\n";
          onRegenerateSection("benefits-research", "proposal-benefits-research");
          return;
        }

        const content = streamRef.current.trim();
        if (content) {
          setSections((prev) => ({
            ...prev,
            [key]: {
              ...prev[key],
              content,
              source: "ai",
            },
          }));
          onSaveSection(key, content);
        }
        streamRef.current = "";
        benefitsPhaseRef.current = null;
        setRegeneratingKey(null);
        return;
      }

      streamRef.current += data;
      setSections((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          content: streamRef.current,
          source: "ai",
        },
      }));
    },
    [onRegenerateSection, onSaveSection]
  );

  useEffect(() => {
    if (!ablyKey || !regeneratingKey) return;

    const client = new Ably.Realtime({ key: ablyKey });
    const channel = client.channels.get(`paper-${paperId}`);
    const events =
      regeneratingKey === "lit_review"
        ? ["proposal-lit-review"]
        : ["proposal-benefits-practical", "proposal-benefits-research"];

    for (const event of events) {
      channel.subscribe(event, handleAblyMessage);
    }

    return () => {
      for (const event of events) {
        channel.unsubscribe(event, handleAblyMessage);
      }
      client.close();
    };
  }, [ablyKey, handleAblyMessage, paperId, regeneratingKey]);

  const startRegenerate = (key: string) => {
    streamRef.current = "";
    setRegeneratingKey(key);

    if (key === "benefits") {
      benefitsPhaseRef.current = "practical";
      onRegenerateSection("benefits-practical", "proposal-benefits-practical");
      return;
    }

    onRegenerateSection(
      key,
      key === "lit_review" ? "proposal-lit-review" : `proposal-${key}`
    );
  };

  return (
    <div className={classes.shell}>
      <header className={classes.pageHeader}>
        <div className={classes.headerTop}>
          <div>
            <div className={classes.pageTitle}>Review proposal</div>
            <div className={classes.pageSub}>
              Assemble the six-part proposal, verify APA references, and export.
            </div>
          </div>
        </div>
        {integrityBlocked ? (
          <Checkbox
            size="xs"
            label="Export anyway — I have reviewed citation issues"
            checked={exportOverride}
            onChange={(e) => onExportOverride(e.currentTarget.checked)}
          />
        ) : null}
        {metadataIssues.length > 0 ? (
          <Checkbox
            size="xs"
            label="Export anyway — title page will be missing author/affiliation details"
            checked={metadataOverride}
            onChange={(e) => onMetadataOverride(e.currentTarget.checked)}
          />
        ) : null}
        {actionMessage ? (
          <Text size="xs" c="dimmed">
            {actionMessage}
          </Text>
        ) : null}
      </header>

      <ReviewTabBar activeTab={tab} onTabChange={setTab} />

      <div className={classes.body}>
        {tab === "preview" && (
          <div className={classes.mainRow}>
            <div className={classes.previewCol}>
              <div className={classes.docHeader}>
                <div>
                  <div className={classes.docTitle}>{paperTitle}</div>
                  {abstractBody ? (
                    <div className={classes.pageSub}>Executive summary included</div>
                  ) : null}
                </div>
                <span className={classes.progressBadge}>
                  {readiness.percent}% assembled
                </span>
              </div>

              <ProposalAccordion
                paperId={paperId}
                sections={sections}
                onSave={onSaveSection}
                onRegenerate={startRegenerate}
                savingKey={savingKey}
                regeneratingKey={regeneratingKey}
              />

              <ProposalExportPanel
                paperId={paperId}
                paperTitle={paperTitle}
                generatedDocuments={generatedDocuments}
                timeZone={timeZone}
                exportPptx={exportPptx}
                exportAllowed={exportAllowed}
                metadataIssues={metadataIssues}
                hasActiveSubscription={hasActiveSubscription}
                exportLimitRemaining={exportLimitRemaining}
                unlimitedExport={unlimitedExport}
                watermarkExports={watermarkExports}
                isPending={isPending}
              />
            </div>

            <ProposalReadinessPanel
              paperId={paperId}
              percent={readiness.percent}
              readyCount={readiness.readyCount}
              totalCount={readiness.totalCount}
              setupReady={readiness.setupReady}
              writingReady={readiness.writingReady}
              methodReady={readiness.methodReady}
              referencesReady={readiness.referencesReady}
              metadataIssues={metadataIssues}
              integrity={integrity}
              isPending={isPending}
              onFixIntegrity={() => setTab("integrity")}
            />
          </div>
        )}

        {tab === "apa_references" && (
          <ApaReferencesPanel
            paperId={paperId}
            libraryEntries={libraryEntries}
            stitchedReferences={sections.references?.content ?? ""}
          />
        )}

        {tab === "integrity" && (
          <div className={classes.tabPanel}>
            <Text size="sm" fw={600} mb={8}>
              Reference integrity check
            </Text>
            <Text size="xs" c="dimmed" mb={10}>
              Orphan or unsupported citations block DOCX export until resolved or
              overridden.
            </Text>
            <Group gap="xs" mb={10}>
              {integrity.sections.map((section) => (
                <Badge
                  key={section.section}
                  variant="light"
                  color={
                    section.status === "clean"
                      ? "green"
                      : section.status === "issues"
                        ? "red"
                        : section.status === "pending"
                          ? "blue"
                          : "gray"
                  }
                >
                  {section.section.replace(/_/g, " ")}
                  {section.summary
                    ? ` · ${
                        (section.summary.unknown ?? 0) +
                        (section.summary.unsupported ?? 0) +
                        (section.summary.ambiguous ?? 0)
                      } issue(s)`
                    : ""}
                </Badge>
              ))}
            </Group>
            <Form method="post">
              <input type="hidden" name="paperId" value={paperId} />
              <Button
                type="submit"
                name="intent"
                value="run-integrity"
                size="xs"
                disabled={isPending}
                loading={isPending}
              >
                {integrity.overall === "not_run"
                  ? "Run integrity check"
                  : "Re-run integrity check"}
              </Button>
            </Form>
          </div>
        )}

        {tab === "diagrams" && (
          <div className={classes.tabPanel}>
            <FrameworkDiagramPanel
              paperId={paperId}
              mermaidSource={sections.diagram?.content}
              imageUrl={
                sections.diagram?.image_url ?? framework?.rendered_png_url
              }
            />
          </div>
        )}
      </div>

      <footer className={classes.profNote}>
        <div className={classes.profAvatar} aria-hidden />
        <div>
          <div className={classes.profTitle}>Prof Z</div>
          <div className={classes.profText}>
            Run the integrity check before export. Stitched sections cost 0
            tokens; use Ask Prof Z on §2 Literature Review or §6 Benefits when
            you need a fresh AI draft.
          </div>
        </div>
      </footer>
    </div>
  );
}
