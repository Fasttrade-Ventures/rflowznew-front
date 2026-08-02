import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";
import { FormattedText } from "#app/components/ui/FormattedText";
import {
  GeneratedDocument,
  generateDocuments,
  getPaper,
  getPaperAbstractSec,
  getPaperGeneratedDocuments,
} from "#app/services/paper.server";
import { requireAuth } from "#app/services/authentication.server";
import {
  FormattingPreferences,
  getFormattingPreferences,
  resetFormattingPreferences,
  saveFormattingPreferences,
} from "#app/services/formatting.server";
import { FormattingPanel } from "#app/components/formatting-panel";
import {
  getIntegrity,
  getLibraryEntries,
  runIntegrityCheck,
  type IntegritySection,
} from "#app/services/library.server";
import { getFramework } from "#app/services/framework.server";
import { getProposalAssembly, saveProposalSection } from "#app/services/proposal-assembly.server";
import {
  generateAiLiteratureReview,
  generateAiResearchSignificant,
} from "#app/services/ai.server";
import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import { getHints } from "#app/utils/client-hints";
import {
  getApiErrorMessage,
  getAskProfZErrorTitle,
  isPlanLimitError,
} from "#app/utils/api-error";
import { invariant } from "@epic-web/invariant";
import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useRevalidator,
} from "@remix-run/react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";
import classes from "./_index.module.css";
import { useDelayedIsPending } from "#app/utils/misc";
import { getCurrentUserSubscription } from "#app/services/subscription.server";
import { ReviewProposalV2 } from "#app/components/paper-v2/ReviewProposalV2";
import { getProjectMetadataIssues, projectMetadataWarningMessage } from "#app/utils/project-metadata-export";

dayjs.extend(utc);
dayjs.extend(timezone);

export function shouldRevalidate({
  formData,
  defaultShouldRevalidate,
}: {
  formData?: FormData;
  defaultShouldRevalidate: boolean;
}) {
  const intent = formData?.get("intent");
  if (
    intent === "save-proposal-section" ||
    intent === "regenerate-proposal-section"
  ) {
    return false;
  }
  return defaultShouldRevalidate;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");

  const [
    res,
    paperRes,
    generatedDocumentsResponse,
    subscriptionRes,
    formattingRes,
    integrityRes,
    proposalRes,
    libraryRes,
    frameworkRes,
  ] = await Promise.all([
    getPaperAbstractSec({ paperId, request }),
    getPaper({ paperId, request }),
    getPaperGeneratedDocuments({ paperId, request }),
    getCurrentUserSubscription({ request }),
    getFormattingPreferences({ request }),
    getIntegrity({ paperId, request }),
    isPaperV2FlowEnabled()
      ? getProposalAssembly({ paperId, request })
      : Promise.resolve({ data: null }),
    isPaperV2FlowEnabled()
      ? getLibraryEntries({ paperId, request })
      : Promise.resolve({ data: null }),
    isPaperV2FlowEnabled()
      ? getFramework({ paperId, request })
      : Promise.resolve({ data: null }),
  ]);

  const integrity = integrityRes.data ?? {
    success: false,
    overall: "not_run" as const,
    sections: [],
  };

  const exportPptx = subscriptionRes.data?.features?.export_pptx ?? false;
  const documentVersionLimit =
    subscriptionRes.data?.features?.document_version_limit ?? null;

  const generatedDocuments =
    generatedDocumentsResponse.data?.generatedDocuments || [];

  const formatting = {
    preferences: formattingRes.data?.preferences,
    isCustomized: formattingRes.data?.is_customized ?? false,
  };

  const paperV2Flow = isPaperV2FlowEnabled();
  const proposalSections = proposalRes.data?.sections ?? null;
  const paper = paperRes.data?.paper;
  const paperTitle = paper?.title ?? "Research proposal";
  const paperAuthors = paper?.authors ?? [];
  const paperAffiliations = paper?.affiliations ?? [];
  const libraryEntries = libraryRes?.data?.entries ?? [];
  const framework = frameworkRes?.data?.framework ?? null;

  const basePayload = {
    paperId,
    paperTitle,
    paperAuthors,
    paperAffiliations,
    timeZone: getHints(request).timeZone,
    generatedDocuments,
    subscription: subscriptionRes.data?.subscription,
    exportPptx,
    documentVersionLimit,
    hasActiveSubscription:
      user.subscription_status === "active" ||
      user.subscription_status === "trialing",
    formatting,
    integrity,
    proposalSections,
    libraryEntries,
    framework,
    paperV2Flow,
  };

  if (res.data?.message === "No abstract found for this paper") {
    return json({
      ...basePayload,
      abstract: null,
    });
  }
  return json({
    ...basePayload,
    abstract: res.data,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const paperId = formData.get("paperId") as string;

  if (intent === "save-proposal-section") {
    const sectionKey = formData.get("section_key") as string;
    const content = (formData.get("content") as string) ?? "";
    try {
      await saveProposalSection({ request, paperId, sectionKey, content });
    } catch {
      // Silently ignore save errors for empty sections
    }
    return json({ message: "Section saved" });
  }

  if (intent === "regenerate-proposal-section") {
    const section = formData.get("section") as string;
    const ablyEventName = formData.get("ably_event_name") as string;

    try {
      if (section === "lit_review") {
        await generateAiLiteratureReview({ request, paperId, ablyEventName });
        return json({ message: "Regenerating literature review…" });
      }

      if (section === "benefits-practical") {
        await generateAiResearchSignificant({
          request,
          paperId,
          field: "practical_contribution",
          ablyEventName,
        });
        return json({ message: "Regenerating practical contribution…" });
      }

      if (section === "benefits-research") {
        await generateAiResearchSignificant({
          request,
          paperId,
          field: "research_contribution",
          ablyEventName,
        });
        return json({ message: "Regenerating research contribution…" });
      }

      return json({ message: "Unknown section" }, { status: 400 });
    } catch (error) {
      return json({
        message: getApiErrorMessage(error),
        serverError: getApiErrorMessage(error),
        planLimit: isPlanLimitError(error),
        errorTitle: getAskProfZErrorTitle(error),
        success: false,
      });
    }
  }

  if (intent === "generate-documents") {
    await generateDocuments({ paperId, request });
    return json({ message: "Documents is generating please wait ..." });
  }

  if (intent === "save-formatting") {
    const preferences = JSON.parse(
      formData.get("preferences") as string
    ) as FormattingPreferences;
    const res = await saveFormattingPreferences({ request, preferences });
    return json({ message: res.data?.message ?? "Formatting saved" });
  }

  if (intent === "run-integrity") {
    const res = await runIntegrityCheck({ paperId, request });
    return json({
      message: res.data?.success
        ? "Integrity check queued for all cited sections"
        : "Could not queue the integrity check",
    });
  }

  if (intent === "reset-formatting") {
    const res = await resetFormattingPreferences({ request });
    return json({ message: res.data?.message ?? "Formatting reset" });
  }

  return json({ message: "Invalid intent" });
};

export const ReviewProposalPage = () => {
  const {
    paperId,
    paperTitle,
    paperAuthors,
    paperAffiliations,
    abstract,
    timeZone,
    generatedDocuments,
    subscription,
    exportPptx,
    documentVersionLimit,
    hasActiveSubscription,
    formatting,
    integrity,
    proposalSections,
    libraryEntries,
    framework,
    paperV2Flow,
  } = useLoaderData<typeof loader>();
  const sectionFetcher = useFetcher();
  const regenerateFetcher = useFetcher();
  const revalidator = useRevalidator();

  const isPending = useDelayedIsPending({
    delay: 100,
    minDuration: 400,
    formMethod: "POST",
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const hasPendingDocuments = generatedDocuments.some(
      (doc) =>
        doc.docx_generating_status === "pending" ||
        doc.pdf_generating_status === "pending" ||
        doc.pptx_generating_status === "pending"
    );

    if (hasPendingDocuments) {
      let attempts = 0;
      const maxAttempts = 40;

      intervalId = setInterval(() => {
        attempts += 1;
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          return;
        }
        revalidator.revalidate();
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [generatedDocuments, revalidator]);

  const formatDate = (date: string) => {
    return dayjs(date).tz(timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = formatDate(abstract?.abstract_sec.created_at!);
  const updatedAt =
    abstract?.abstract_sec.updated_at === abstract?.abstract_sec.created_at
      ? "-"
      : formatDate(abstract?.abstract_sec.updated_at!);

  const actionData = useActionData<typeof action>();

  // Screen 9's reference-integrity gate: export is blocked until the check
  // passes, with a documented override.
  const [exportOverride, setExportOverride] = useState(false);
  const [metadataOverride, setMetadataOverride] = useState(false);
  const integrityBlocked = integrity.overall !== "pass";
  const metadataIssues = getProjectMetadataIssues(
    paperAuthors,
    paperAffiliations
  );
  const metadataBlocked = metadataIssues.length > 0;
  const exportAllowed =
    (!integrityBlocked || exportOverride) &&
    (!metadataBlocked || metadataOverride);

  // Poll while a check is running. "pending" covers in-flight verifications;
  // the queued-message case covers the window right after run-integrity when
  // jobs haven't started yet and sections still read as not_run.
  const justQueued = (actionData?.message ?? "").includes("queued");
  useEffect(() => {
    if (integrity.overall === "pass" || integrity.overall === "fail") return;
    if (integrity.overall === "not_run" && !justQueued) return;
    const intervalId = setInterval(() => revalidator.revalidate(), 3000);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 120_000);
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [integrity.overall, justQueued, revalidator]);

  if (!abstract && !(paperV2Flow && proposalSections)) {
    return (
      <Center>
        <Stack align="center">
          <Text>No abstract found for this paper</Text>
          <Button
            component={Link}
            to={`/paper/${paperId}/review-proposal/abstract`}
            leftSection={
              <Icon
                name="square-rounded-plus-outline"
                style={{ width: 20, height: 20 }}
              />
            }
          >
            Add abstract
          </Button>
        </Stack>
      </Center>
    );
  }

  if (paperV2Flow && proposalSections) {
    return (
      <ReviewProposalV2
        paperId={paperId}
        paperTitle={paperTitle}
        abstractBody={abstract?.abstract_sec.body ?? undefined}
        sections={proposalSections}
        libraryEntries={libraryEntries}
        framework={framework}
        integrity={integrity}
        generatedDocuments={generatedDocuments}
        timeZone={timeZone}
        exportAllowed={exportAllowed}
        exportOverride={exportOverride}
        onExportOverride={setExportOverride}
        metadataIssues={metadataIssues}
        metadataOverride={metadataOverride}
        onMetadataOverride={setMetadataOverride}
        exportPptx={exportPptx}
        documentVersionLimit={documentVersionLimit}
        hasActiveSubscription={hasActiveSubscription}
        exportLimitRemaining={subscription?.export_limit_remaining}
        unlimitedExport={subscription?.unlimited_export}
        watermarkExports={subscription?.watermark_exports}
        isPending={isPending}
        actionMessage={actionData?.message ?? null}
        savingKey={
          sectionFetcher.state !== "idle"
            ? (sectionFetcher.formData?.get("section_key") as string)
            : null
        }
        onSaveSection={(key, content) => {
          const fd = new FormData();
          fd.set("intent", "save-proposal-section");
          fd.set("paperId", paperId);
          fd.set("section_key", key);
          fd.set("content", content);
          sectionFetcher.submit(fd, { method: "post" });
        }}
        onRegenerateSection={(section, ablyEventName) => {
          const fd = new FormData();
          fd.set("intent", "regenerate-proposal-section");
          fd.set("paperId", paperId);
          fd.set("section", section);
          fd.set("ably_event_name", ablyEventName);
          regenerateFetcher.submit(fd, { method: "post" });
        }}
      />
    );
  }

  if (!abstract) {
    return null;
  }

  return (
    <Stack>
      <Stack pr="md" pl="md">
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={4}>Executive summary</Title>
            <Group>
              <Text size="xs" c="dimmed">
                Created: {createdAt}
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {updatedAt}
              </Text>
            </Group>
          </Stack>
          <Button
            leftSection={
              <Icon name="pencil-outline" style={{ width: 16, height: 16 }} />
            }
            variant="light"
            component={Link}
            to={`/paper/${paperId}/review-proposal/abstract`}
          >
            Edit
          </Button>
        </Group>
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <FormattedText content={abstract.abstract_sec.body!} />
      </Stack>
      <CDivider />
      <Stack gap="md">
        {formatting.preferences && (
          <Box pl="md" pr="md">
            <FormattingPanel
              preferences={formatting.preferences}
              isCustomized={formatting.isCustomized}
            />
          </Box>
        )}
        <Box pl="md" pr="md">
          {metadataBlocked ? (
            <Alert color="yellow" title="Title page metadata incomplete" mb="md">
              <Stack gap="xs">
                <Text size="sm">
                  {projectMetadataWarningMessage(metadataIssues)}
                </Text>
                <Button
                  component={Link}
                  to={`/paper/${paperId}/settings/edit`}
                  size="compact-xs"
                  variant="light"
                >
                  Open Project settings
                </Button>
                <Checkbox
                  size="xs"
                  label="Export anyway — title page will be missing author/affiliation details"
                  checked={metadataOverride}
                  onChange={(e) => setMetadataOverride(e.currentTarget.checked)}
                />
              </Stack>
            </Alert>
          ) : null}
          <Alert
            color={
              integrity.overall === "pass"
                ? "green"
                : integrity.overall === "pending"
                ? "blue"
                : integrity.overall === "fail"
                ? "red"
                : "yellow"
            }
            title={
              integrity.overall === "pass"
                ? "Reference integrity: passed"
                : integrity.overall === "pending"
                ? "Reference integrity: checking…"
                : integrity.overall === "fail"
                ? "Reference integrity: issues found"
                : "Reference integrity: not checked yet"
            }
          >
            <Stack gap="xs">
              {integrity.sections.length > 0 && (
                <Group gap="xs">
                  {integrity.sections.map((section: IntegritySection) => (
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
                        : ` · ${section.status.replace(/_/g, " ")}`}
                    </Badge>
                  ))}
                </Group>
              )}
              <Group gap="sm">
                <Form method="post">
                  <input type="hidden" name="paperId" value={paperId} />
                  <Button
                    type="submit"
                    name="intent"
                    value="run-integrity"
                    size="compact-sm"
                    variant="light"
                    loading={isPending}
                  >
                    {integrity.overall === "not_run"
                      ? "Run integrity check"
                      : "Re-run integrity check"}
                  </Button>
                </Form>
                {integrityBlocked && (
                  <Checkbox
                    size="xs"
                    label="Export anyway — I have reviewed the citation issues"
                    checked={exportOverride}
                    onChange={(e) => setExportOverride(e.currentTarget.checked)}
                  />
                )}
              </Group>
            </Stack>
          </Alert>
        </Box>
        <Center>
          <Form method="post">
            <input type="hidden" name="paperId" value={paperId} />
            <Stack align="center" gap="xs">
              {!hasActiveSubscription ||
              subscription?.export_limit_remaining === 0 ? (
                <Button
                  type="button"
                  disabled
                  name="intent"
                  value="generate-documents"
                  size="md"
                  variant="gradient"
                  loading={isPending}
                  leftSection={
                    <Icon
                      name="pika-file-bolt"
                      style={{ width: 26, height: 26 }}
                    />
                  }
                >
                  Generate documents
                </Button>
              ) : (
                <Button
                  type="submit"
                  name="intent"
                  value="generate-documents"
                  size="md"
                  variant="gradient"
                  disabled={!exportAllowed}
                  loading={isPending}
                  leftSection={
                    <Icon
                      name="pika-file-bolt"
                      style={{ width: 26, height: 26 }}
                    />
                  }
                >
                  Generate documents
                </Button>
              )}
              {subscription && (
                <>
                  {subscription.unlimited_export ? (
                    <Text size="xs" c="var(--mantine-primary-color-filled)">
                      Unlimited export
                    </Text>
                  ) : (
                    <Text size="xs" c="var(--mantine-primary-color-filled)">
                      {subscription?.export_limit_remaining} export remaining
                      this month
                    </Text>
                  )}
                  {subscription.watermark_exports ? (
                    <Text size="xs" c="dimmed">
                      Free plan exports include a watermark.
                    </Text>
                  ) : null}
                  {!exportPptx ? (
                    <Text size="xs" c="dimmed">
                      PowerPoint export is available on Standard and
                      Professional plans.
                    </Text>
                  ) : (
                    <Text size="xs" c="var(--mantine-primary-color-filled)">
                      DOCX, PDF, and PPTX will be generated.
                    </Text>
                  )}
                </>
              )}

              {actionData && (
                <Text size="sm" c="var(--mantine-primary-color-filled)">
                  {actionData.message}
                </Text>
              )}
            </Stack>
          </Form>
        </Center>
        <Box pl="md" pr="md">
          <GeneratedDocumentsTable
            generatedDocuments={generatedDocuments}
            timeZone={timeZone}
            exportPptx={exportPptx}
          />
        </Box>
      </Stack>
    </Stack>
  );
};

function GeneratedDocumentsTable({
  generatedDocuments,
  timeZone,
  exportPptx,
}: {
  generatedDocuments: GeneratedDocument[];
  timeZone: string;
  exportPptx: boolean;
}) {
  const formatDate = (date: string) => {
    return dayjs(date).tz(timeZone).format("DD/MM/YYYY HH:mm");
  };
  const formatDateForFileName = (date: string) => {
    return dayjs(date).tz(timeZone).format("DD-MM-YYYY-HH-mm");
  };

  if (generatedDocuments.length === 0) {
    return (
      <Box>
        <Center>
          <Stack align="center" className={classes.emptyState}>
            <Icon name="pika-file-bolt" style={{ width: 56, height: 56 }} />
            <Text>No documents generated yet</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  return (
    <Table withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: "80%" }}>File generated at</Table.Th>
          <Table.Th style={{ width: "20%" }}></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {generatedDocuments.map((generatedDocument) => (
          <Table.Tr key={generatedDocument.id}>
            <Table.Td>
              <Text>
                Generated at: {formatDate(generatedDocument.created_at)}
              </Text>
            </Table.Td>
            <Table.Td
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              {generatedDocument.docx_generating_status === "completed" ? (
                <Button
                  variant="light"
                  leftSection={
                    <Icon name="pika-file" style={{ width: 16, height: 16 }} />
                  }
                  onClick={() => {
                    window.location.href = `/resources/generate-docx.docx?url=${
                      generatedDocument.docx_url
                    }&date=${formatDateForFileName(generatedDocument.created_at)}`;
                  }}
                >
                  DOCX
                </Button>
              ) : generatedDocument.docx_generating_status === "pending" ? (
                <Button
                  disabled
                  loading
                  variant="light"
                  color="gray"
                  leftSection={
                    <Icon name="pika-file" style={{ width: 16, height: 16 }} />
                  }
                >
                  DOCX
                </Button>
              ) : (
                <Button
                  disabled
                  variant="light"
                  color="red"
                  leftSection={
                    <Icon name="pika-file" style={{ width: 16, height: 16 }} />
                  }
                >
                  Failed
                </Button>
              )}

              {generatedDocument.pdf_generating_status === "completed" ? (
                <Button
                  component={Link}
                  reloadDocument
                  to={`/resources/generate-pdf.pdf?url=${
                    generatedDocument.pdf_url
                  }&date=${formatDateForFileName(
                    generatedDocument.created_at
                  )}`}
                  variant="light"
                  leftSection={
                    <Icon name="pika-file" style={{ width: 16, height: 16 }} />
                  }
                >
                  PDF
                </Button>
              ) : generatedDocument.pdf_generating_status === "pending" ? (
                <Button
                  disabled
                  loading
                  variant="light"
                  color="gray"
                  leftSection={
                    <Icon name="pika-file" style={{ width: 16, height: 16 }} />
                  }
                >
                  PDF
                </Button>
              ) : (
                <Button
                  disabled
                  variant="light"
                  color="red"
                  leftSection={
                    <Icon name="pika-file" style={{ width: 16, height: 16 }} />
                  }
                >
                  Failed
                </Button>
              )}

              {exportPptx ? (
                generatedDocument.pptx_generating_status === "completed" ? (
                  <Button
                    component={Link}
                    reloadDocument
                    to={`/resources/generate-pptx.pptx?url=${
                      generatedDocument.pptx_url
                    }&date=${formatDateForFileName(
                      generatedDocument.created_at
                    )}`}
                    variant="light"
                    leftSection={
                      <Icon
                        name="pika-file"
                        style={{ width: 16, height: 16 }}
                      />
                    }
                  >
                    PPTX
                  </Button>
                ) : generatedDocument.pptx_generating_status === "pending" ? (
                  <Button
                    disabled
                    loading
                    variant="light"
                    color="gray"
                    leftSection={
                      <Icon
                        name="pika-file"
                        style={{ width: 16, height: 16 }}
                      />
                    }
                  >
                    PPTX
                  </Button>
                ) : generatedDocument.pptx_generating_status === "failed" ? (
                  <Button
                    disabled
                    variant="light"
                    color="red"
                    leftSection={
                      <Icon
                        name="pika-file"
                        style={{ width: 16, height: 16 }}
                      />
                    }
                  >
                    Failed
                  </Button>
                ) : null
              ) : null}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export default ReviewProposalPage;
