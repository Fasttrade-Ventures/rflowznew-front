import { Icon } from "#app/components/icon";
import { getPaperResearchSignificant } from "#app/services/paper.server";
import { getHints } from "#app/utils/client-hints";
import { redirectWithToast } from "#app/utils/toast.server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { invariant } from "@epic-web/invariant";
import { Button, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import CDivider from "#app/components/ui/CDivider";
import { FormattedText } from "#app/components/ui/FormattedText";

dayjs.extend(utc);
dayjs.extend(timezone);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperResearchSignificant({ paperId, request });
    if (
      !res.data?.research_significant ||
      res.data?.research_significant.completion_percentage !== 100
    ) {
      return redirect(`/paper/${paperId}/research-significant/form`);
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

export const ResearchSignificantIndexPage = () => {
  const data = useLoaderData<typeof loader>();
  const formatDate = (date: string) => {
    return dayjs(date).tz(data.timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = formatDate(data?.research_significant?.created_at!);
  const updatedAt =
    data?.research_significant?.updated_at ===
    data?.research_significant?.created_at
      ? "-"
      : formatDate(data?.research_significant?.updated_at!);
  return (
    <Stack>
      <Group justify="space-between" pr="md" pl="md">
        <Stack gap="xs">
          <Title order={4}>Research Significant</Title>
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
          to={`/paper/${data?.research_significant?.paper_id}/research-significant/form`}
        >
          Edit
        </Button>
      </Group>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Practical Contribution</Title>
        <FormattedText
          content={data?.research_significant?.practical_contribution!}
        />
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Research Contribution</Title>
        <FormattedText
          content={data?.research_significant?.research_contribution!}
        />
      </Stack>
    </Stack>
  );
};

export default ResearchSignificantIndexPage;
