import { Icon } from "#app/components/icon";
import { getPaperSolvingTheProblem } from "#app/services/paper.server";
import { getHints } from "#app/utils/client-hints";
import { redirectWithToast } from "#app/utils/toast.server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { CDivider } from "#app/components/ui/CDivider";
import { FormattedText } from "#app/components/ui/FormattedText";
import { invariant } from "@epic-web/invariant";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

dayjs.extend(utc);
dayjs.extend(timezone);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperSolvingTheProblem({ paperId, request });
    if (
      res.data?.message ===
      "No solving the problem section found for this paper"
    ) {
      return redirect(`/paper/${paperId}/solving-the-problem/form`);
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

export const SolvingTheProblemPage = () => {
  const data = useLoaderData<typeof loader>();

  const formatDate = (date: string) => {
    return dayjs(date).tz(data.timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = data?.solving_the_problem?.created_at
    ? formatDate(data.solving_the_problem.created_at)
    : "-";

  const updatedAt =
    !data?.solving_the_problem?.updated_at ||
    data.solving_the_problem.updated_at === data.solving_the_problem.created_at
      ? "-"
      : formatDate(data.solving_the_problem.updated_at);
  return (
    <Stack>
      <Stack pr="md" pl="md">
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={4}>Solving the Problem</Title>
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
            to={`/paper/${data?.solving_the_problem?.paper_id}/solving-the-problem/form`}
          >
            Edit
          </Button>
        </Group>
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <FormattedText content={data?.solving_the_problem?.body || ""} />
      </Stack>
    </Stack>
  );
};

export default SolvingTheProblemPage;
