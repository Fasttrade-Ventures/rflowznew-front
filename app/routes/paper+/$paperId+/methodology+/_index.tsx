import { Icon } from "#app/components/icon";
import { PaperPanel, PaperV2Page } from "#app/components/paper-v2/PaperV2Screens";
import { getPaperMethodology } from "#app/services/paper.server";
import { usePaperV2Flow } from "#app/utils/use-paper-v2-flow";
import { getHints } from "#app/utils/client-hints";
import { redirectWithToast } from "#app/utils/toast.server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { invariant } from "@epic-web/invariant";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import CDivider from "#app/components/ui/CDivider";
import { V2ReadContent } from "#app/components/paper-v2/V2ReadContent";
import { FormattedText } from "#app/components/ui/FormattedText";

dayjs.extend(utc);
dayjs.extend(timezone);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperMethodology({ paperId, request });
    if (
      !res.data?.methodology ||
      res.data?.methodology.completion_percentage !== 100
    ) {
      return redirect(`/paper/${paperId}/methodology/form`);
    }
    return json({ ...res.data, timeZone: getHints(request).timeZone });
  } catch (error) {
    return redirectWithToast("/paper", {
      type: "error",
      title: "Paper not found",
      description: "Paper not found",
    });
  }
};

export const MethodologyIndexPage = () => {
  const data = useLoaderData<typeof loader>();
  const isV2 = usePaperV2Flow();
  const formatDate = (date: string) => {
    return dayjs(date).tz(data.timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = formatDate(data?.methodology?.created_at!);
  const updatedAt =
    data?.methodology?.updated_at === data?.methodology?.created_at
      ? "-"
      : formatDate(data?.methodology?.updated_at!);

  const editButton = (
    <Button
      leftSection={
        <Icon name="pencil-outline" style={{ width: 16, height: 16 }} />
      }
      variant="light"
      size="xs"
      component={Link}
      to={`/paper/${data?.methodology?.paper_id}/methodology/form`}
    >
      Edit
    </Button>
  );

  const sections = [
    { title: "Research design", content: data?.methodology?.research_design ?? "" },
    {
      title: "Data collection methods",
      content: data?.methodology?.data_collection_methods ?? "",
    },
    {
      title: "Analysis techniques",
      content: data?.methodology?.analysis_techniques ?? "",
    },
    {
      title: "Software and tools",
      content: data?.methodology?.software_and_tools ?? "",
    },
  ].filter((section) => section.content.trim() !== "");

  const body = (
    <>
      {!isV2 && (
        <>
          <Group justify="space-between" pr="md" pl="md">
            <Stack gap="xs">
              <Title order={4}>Methodology</Title>
              <Group>
                <Text size="xs" c="dimmed">
                  Created: {createdAt}
                </Text>
                <Text size="xs" c="dimmed">
                  Updated: {updatedAt}
                </Text>
              </Group>
            </Stack>
            {editButton}
          </Group>
          <CDivider />
        </>
      )}
      {sections.map((section, index) =>
        isV2 ? (
          <PaperPanel key={section.title} title={section.title}>
            <V2ReadContent content={section.content} />
          </PaperPanel>
        ) : (
          <Stack key={section.title}>
            {index > 0 && <CDivider />}
            <Stack pr="md" pl="md">
              <Title order={5}>{section.title}</Title>
              <FormattedText content={section.content} />
            </Stack>
          </Stack>
        )
      )}
    </>
  );

  if (isV2) {
    return (
      <PaperV2Page
        title="Methodology"
        subtitle={`Created ${createdAt} · Updated ${updatedAt}`}
        guide="Align design, data collection, and analysis with your research questions."
        profZ="Coherence checks will flag mismatches between RQs and methods in Phase 5."
        actions={editButton}
      >
        <Stack gap="sm">{body}</Stack>
      </PaperV2Page>
    );
  }

  return <Stack>{body}</Stack>;
};

export default MethodologyIndexPage;
