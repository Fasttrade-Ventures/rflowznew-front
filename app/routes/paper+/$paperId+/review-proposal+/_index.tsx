import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";
import { FormattedText } from "#app/components/ui/FormattedText";
import {
  GeneratedDocument,
  generateDocuments,
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
import { getHints } from "#app/utils/client-hints";
import { invariant } from "@epic-web/invariant";
import {
  Box,
  Button,
  Center,
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
  useLoaderData,
  useRevalidator,
} from "@remix-run/react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect } from "react";
import classes from "./_index.module.css";
import { useDelayedIsPending } from "#app/utils/misc";
import { getCurrentUserSubscription } from "#app/services/subscription.server";

dayjs.extend(utc);
dayjs.extend(timezone);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");

  const [res, generatedDocumentsResponse, subscriptionRes, formattingRes] =
    await Promise.all([
      getPaperAbstractSec({ paperId, request }),
      getPaperGeneratedDocuments({ paperId, request }),
      getCurrentUserSubscription({ request }),
      getFormattingPreferences({ request }),
    ]);

  const exportPptx = subscriptionRes.data?.features?.export_pptx ?? false;

  const generatedDocuments =
    generatedDocumentsResponse.data?.generatedDocuments || [];

  const formatting = {
    preferences: formattingRes.data?.preferences,
    isCustomized: formattingRes.data?.is_customized ?? false,
  };

  if (res.data?.message === "No abstract found for this paper") {
    return json({
      paperId,
      abstract: null,
      timeZone: getHints(request).timeZone,
      generatedDocuments,
      subscription: subscriptionRes.data?.subscription,
      exportPptx,
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
      formatting,
    });
  }
  return json({
    paperId,
    abstract: res.data,
    timeZone: getHints(request).timeZone,
    generatedDocuments,
    subscription: subscriptionRes.data?.subscription,
    exportPptx,
    hasActiveSubscription:
      user.subscription_status === "active" ||
      user.subscription_status === "trialing",
    formatting,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const paperId = formData.get("paperId") as string;

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

  if (intent === "reset-formatting") {
    const res = await resetFormattingPreferences({ request });
    return json({ message: res.data?.message ?? "Formatting reset" });
  }

  return json({ message: "Invalid intent" });
};

export const ReviewProposalPage = () => {
  const {
    paperId,
    abstract,
    timeZone,
    generatedDocuments,
    subscription,
    exportPptx,
    hasActiveSubscription,
    formatting,
  } = useLoaderData<typeof loader>();
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

  if (!abstract) {
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
                  component={Link}
                  reloadDocument
                  to={`/resources/generate-docx.docx?url=${
                    generatedDocument.docx_url
                  }&date=${formatDateForFileName(
                    generatedDocument.created_at
                  )}`}
                  variant="light"
                  leftSection={
                    <Icon name="pika-file" style={{ width: 16, height: 16 }} />
                  }
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
