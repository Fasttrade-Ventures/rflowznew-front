import type { GeneratedDocument } from "#app/services/paper.server";
import type { ProjectMetadataIssue } from "#app/utils/project-metadata-export";
import { projectMetadataWarningMessage } from "#app/utils/project-metadata-export";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { Form, Link } from "@remix-run/react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useState } from "react";

import classes from "./review-proposal-v2.module.css";

dayjs.extend(utc);
dayjs.extend(timezone);

type ProposalExportPanelProps = {
  paperId: string;
  paperTitle?: string;
  generatedDocuments: GeneratedDocument[];
  timeZone: string;
  exportPptx: boolean;
  exportAllowed: boolean;
  metadataIssues: ProjectMetadataIssue[];
  hasActiveSubscription: boolean;
  exportLimitRemaining?: number;
  unlimitedExport?: boolean;
  watermarkExports?: boolean;
  documentVersionLimit?: number | null;
  isPending: boolean;
};

function formatDate(date: string, timeZone: string) {
  return dayjs(date).tz(timeZone).format("DD/MM/YYYY HH:mm");
}

function formatDateForFileName(date: string, timeZone: string) {
  return dayjs(date).tz(timeZone).format("DD-MM-YYYY-HH-mm");
}

type FormatKey = "docx" | "pdf" | "pptx";

function statusFor(doc: GeneratedDocument, format: FormatKey) {
  if (format === "docx") return doc.docx_generating_status;
  if (format === "pdf") return doc.pdf_generating_status;
  return doc.pptx_generating_status;
}

function urlFor(doc: GeneratedDocument, format: FormatKey) {
  if (format === "docx") return doc.docx_url;
  if (format === "pdf") return doc.pdf_url;
  return doc.pptx_url;
}

function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  if (slug.length <= 40) return slug;
  // Truncate at the last word boundary within 40 chars so the filename stays readable.
  const cut = slug.slice(0, 40);
  const lastDash = cut.lastIndexOf("-");
  return lastDash > 20 ? cut.slice(0, lastDash) : cut;
}

function downloadPath(
  format: FormatKey,
  url: string,
  date: string,
  titleSlug?: string
) {
  const ext = format === "docx" ? "docx" : format === "pdf" ? "pdf" : "pptx";
  const base = `/resources/generate-${ext}.${ext}?url=${encodeURIComponent(url)}&date=${date}`;
  return titleSlug ? `${base}&title=${encodeURIComponent(titleSlug)}` : base;
}

function FormatButton({
  format,
  doc,
  timeZone,
  label,
  titleSlug,
}: {
  format: FormatKey;
  doc: GeneratedDocument | undefined;
  timeZone: string;
  label: string;
  titleSlug?: string;
}) {
  const status = doc ? statusFor(doc, format) : null;
  const url = doc ? urlFor(doc, format) : null;
  const dateSlug = doc
    ? formatDateForFileName(doc.created_at, timeZone)
    : "";

  if (status === "completed" && url) {
    return (
      <Button
        component={Link}
        to={downloadPath(format, url, dateSlug, titleSlug)}
        reloadDocument
        variant="outline"
        size="xs"
      >
        {label}
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button variant="outline" size="xs" disabled>
        {label}…
      </Button>
    );
  }

  if (status === "failed") {
    return (
      <Button variant="outline" size="xs" color="red" disabled>
        {label} failed
      </Button>
    );
  }

  return (
    <Button variant="outline" size="xs" disabled>
      {label}
    </Button>
  );
}

export function ProposalExportPanel({
  paperId,
  paperTitle,
  generatedDocuments,
  timeZone,
  exportPptx,
  exportAllowed,
  metadataIssues,
  hasActiveSubscription,
  exportLimitRemaining,
  unlimitedExport,
  watermarkExports,
  documentVersionLimit,
  isPending,
}: ProposalExportPanelProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const latest = generatedDocuments[0];
  const titleSlug = paperTitle ? slugifyTitle(paperTitle) : undefined;

  const atVersionLimit =
    documentVersionLimit != null &&
    generatedDocuments.length >= documentVersionLimit;

  const canGenerate =
    exportAllowed &&
    hasActiveSubscription &&
    !atVersionLimit &&
    (unlimitedExport || (exportLimitRemaining ?? 0) > 0);
  const hasPending = generatedDocuments.some(
    (doc) =>
      doc.docx_generating_status === "pending" ||
      doc.pdf_generating_status === "pending" ||
      doc.pptx_generating_status === "pending"
  );
  const metadataWarning = projectMetadataWarningMessage(metadataIssues);

  return (
    <>
    <Modal
      opened={upgradeModalOpen}
      onClose={() => setUpgradeModalOpen(false)}
      title="Upgrade to generate more versions"
      centered
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm">
          Your current plan allows <strong>{documentVersionLimit} document version</strong> per
          project. Upgrade to a paid plan to generate unlimited versions and
          unlock additional features.
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            size="xs"
            onClick={() => setUpgradeModalOpen(false)}
          >
            Maybe later
          </Button>
          <Button
            component={Link}
            to="/subscription"
            size="xs"
            color="orange"
            onClick={() => setUpgradeModalOpen(false)}
          >
            View plans
          </Button>
        </Group>
      </Stack>
    </Modal>
    <div className={classes.exportPanel}>
      {metadataWarning ? (
        <div className={classes.metadataWarning}>
          <span className={classes.metadataWarningIcon} aria-hidden>
            ⚠
          </span>
          <div>
            <div className={classes.metadataWarningTitle}>
              Title page metadata incomplete
            </div>
            <div className={classes.pageSub}>{metadataWarning}</div>
            <Link
              to={`/paper/${paperId}/settings/edit`}
              className={classes.metadataWarningLink}
            >
              Open Project settings
            </Link>
          </div>
        </div>
      ) : null}

      <div className={classes.exportPanelHeader}>
        <div>
          <div className={classes.statusTitle}>Export proposal</div>
          <div className={classes.pageSub}>
            Generate DOCX, PDF
            {exportPptx ? ", and PPTX" : ""} from your assembled sections.
          </div>
        </div>
        <Group gap={6} wrap="wrap" className={classes.exportActions}>
          {latest ? (
            <>
              <FormatButton
                format="docx"
                doc={latest}
                timeZone={timeZone}
                label="DOCX"
                titleSlug={titleSlug}
              />
              <FormatButton
                format="pdf"
                doc={latest}
                timeZone={timeZone}
                label="PDF"
                titleSlug={titleSlug}
              />
              {exportPptx ? (
                <FormatButton
                  format="pptx"
                  doc={latest}
                  timeZone={timeZone}
                  label="PPTX"
                  titleSlug={titleSlug}
                />
              ) : null}
            </>
          ) : (
            <span className={classes.exportNoVersionHint}>
              Click <strong>New version</strong> to generate your documents
            </span>
          )}
          {atVersionLimit ? (
            <Button
              size="xs"
              color="orange"
              onClick={() => setUpgradeModalOpen(true)}
            >
              New version
            </Button>
          ) : (
            <Form method="post">
              <input type="hidden" name="paperId" value={paperId} />
              <Button
                type="submit"
                name="intent"
                value="generate-documents"
                size="xs"
                disabled={!canGenerate || isPending || hasPending}
                loading={isPending || hasPending}
              >
                New version
              </Button>
            </Form>
          )}
        </Group>
      </div>

      <div className={classes.exportMeta}>
        {!hasActiveSubscription ? (
          <span>Active subscription required to export.</span>
        ) : unlimitedExport ? (
          <span>Unlimited exports</span>
        ) : (
          <span>{exportLimitRemaining ?? 0} export(s) remaining this month</span>
        )}
        {watermarkExports ? (
          <span> · Free plan exports include a watermark</span>
        ) : null}
        {!exportPptx ? (
          <span> · PPTX available on Standard and Professional plans</span>
        ) : null}
      </div>

      <div className={classes.historyTitle}>Version history</div>

      {generatedDocuments.length === 0 ? (
        <p className={classes.historyEmpty}>
          No exports yet. Click <strong>New version</strong> to generate DOCX,
          PDF{exportPptx ? ", and PPTX" : ""}.
        </p>
      ) : (
        <div className={classes.historyList}>
          {generatedDocuments.map((doc, index) => (
            <div key={doc.id} className={classes.historyRow}>
              <div className={classes.historyDate}>
                <span className={classes.historyVersion}>
                  v{generatedDocuments.length - index}
                </span>
                <span>{formatDate(doc.created_at, timeZone)}</span>
              </div>
              <Group gap={6} wrap="wrap" className={classes.historyActions}>
                <FormatButton
                  format="docx"
                  doc={doc}
                  timeZone={timeZone}
                  label="DOCX"
                  titleSlug={titleSlug}
                />
                <FormatButton
                  format="pdf"
                  doc={doc}
                  timeZone={timeZone}
                  label="PDF"
                  titleSlug={titleSlug}
                />
                {exportPptx ? (
                  <FormatButton
                    format="pptx"
                    doc={doc}
                    timeZone={timeZone}
                    label="PPTX"
                    titleSlug={titleSlug}
                  />
                ) : null}
              </Group>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
