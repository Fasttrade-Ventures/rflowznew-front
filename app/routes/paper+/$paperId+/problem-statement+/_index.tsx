import { Icon } from "#app/components/icon";
import { getPaperProblemStatement } from "#app/services/paper.server";
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
    const res = await getPaperProblemStatement({ paperId, request });
    if (
      !res.data?.problem_statement ||
      res.data?.problem_statement.completion_percentage !== 100
    ) {
      return redirect(`/paper/${paperId}/problem-statement/form`);
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

export const ProblemStatementIndexPage = () => {
  const data = useLoaderData<typeof loader>();
  const formatDate = (date: string) => {
    return dayjs(date).tz(data.timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = formatDate(data?.problem_statement?.created_at!);
  const updatedAt =
    data?.problem_statement?.updated_at === data?.problem_statement?.created_at
      ? "-"
      : formatDate(data?.problem_statement?.updated_at!);
  return (
    <Stack>
      <Group justify="space-between" pr="md" pl="md">
        <Stack gap="xs">
          <Title order={4}>Problem Statement</Title>
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
          to={`/paper/${data?.problem_statement?.paper_id}/problem-statement/form`}
        >
          Edit
        </Button>
      </Group>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Motivational Problems</Title>
        <FormattedText
          content={data?.problem_statement?.motivational_problem!}
        />
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Gap in Practice</Title>
        <FormattedText content={data?.problem_statement?.gap_in_practice!} />
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Research Problem</Title>
        <FormattedText content={data?.problem_statement?.research_problem!} />
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Gap in Research</Title>
        <FormattedText content={data?.problem_statement?.gap_in_research!} />
      </Stack>
    </Stack>
  );
};

export default ProblemStatementIndexPage;
