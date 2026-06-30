import { Icon } from "#app/components/icon";
import { getPaperMethodology } from "#app/services/paper.server";
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
  const formatDate = (date: string) => {
    return dayjs(date).tz(data.timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = formatDate(data?.methodology?.created_at!);
  const updatedAt =
    data?.methodology?.updated_at === data?.methodology?.created_at
      ? "-"
      : formatDate(data?.methodology?.updated_at!);
  return (
    <Stack>
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
        <Button
          leftSection={
            <Icon name="pencil-outline" style={{ width: 16, height: 16 }} />
          }
          variant="light"
          component={Link}
          to={`/paper/${data?.methodology?.paper_id}/methodology/form`}
        >
          Edit
        </Button>
      </Group>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Research Design</Title>
        <FormattedText content={data?.methodology?.research_design!} />
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Data Collection Methods</Title>
        <FormattedText content={data?.methodology?.data_collection_methods!} />
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Analysis Techniques</Title>
        <FormattedText content={data?.methodology?.analysis_techniques!} />
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Software and Tools</Title>
        <FormattedText content={data?.methodology?.software_and_tools!} />
      </Stack>
    </Stack>
  );
};

export default MethodologyIndexPage;
