import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";
import { getPaperResearchQuestionsAndObjectives } from "#app/services/paper.server";
import { getHints } from "#app/utils/client-hints";
import { redirectWithToast } from "#app/utils/toast.server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { invariant } from "@epic-web/invariant";
import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import classes from "./_index.module.css";
import { FormattedText } from "#app/components/ui/FormattedText";

dayjs.extend(utc);
dayjs.extend(timezone);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperResearchQuestionsAndObjectives({
      paperId,
      request,
    });
    if (
      res.data?.research_question_and_objective.completion_percentage !== 100
    ) {
      return redirect(
        `/paper/${paperId}/research-questions-and-objectives/form`
      );
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

export const ResearchQuestionsAndObjectivesPage = () => {
  const data = useLoaderData<typeof loader>();
  const formatDate = (date: string) => {
    return dayjs(date).tz(data.timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = formatDate(
    data?.research_question_and_objective?.created_at!
  );
  const updatedAt =
    data?.research_question_and_objective?.updated_at ===
    data?.research_question_and_objective?.created_at
      ? "-"
      : formatDate(data?.research_question_and_objective?.updated_at!);
  return (
    <Stack>
      <Group justify="space-between" pr="md" pl="md">
        <Stack gap="xs">
          <Title order={4}>Research Questions and Objectives</Title>
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
          to={`/paper/${data?.research_question_and_objective?.paper_id}/research-questions-and-objectives/form`}
        >
          Edit
        </Button>
      </Group>
      <CDivider />
      <Stack pr="md" pl="md">
        <Title order={5}>Main Research Question</Title>

        <FormattedText
          content={
            data?.research_question_and_objective?.main_research_question!
          }
        />
      </Stack>
      <CDivider my="0" />
      <Box className={classes.subResearchQuestionAndObjectiveContainer}>
        <Stack>
          {data?.research_question_and_objective?.sub_research_question_and_objectives.map(
            (subResearchQuestionAndObjective) => (
              <Box
                className={classes.subResearchQuestionAndObjective}
                key={subResearchQuestionAndObjective.id}
              >
                <Stack>
                  <Text fw={600} size="md" variant="gradient">
                    Sub Research {subResearchQuestionAndObjective.order}
                  </Text>
                  <Stack gap="sm">
                    <Title order={6}>Question</Title>
                    <FormattedText
                      content={subResearchQuestionAndObjective.question!}
                    />
                  </Stack>
                  <Stack gap="sm">
                    <Title order={6}>Objective</Title>
                    <FormattedText
                      content={subResearchQuestionAndObjective.objective!}
                    />
                  </Stack>
                </Stack>
              </Box>
            )
          )}
        </Stack>
      </Box>
    </Stack>
  );
};

export default ResearchQuestionsAndObjectivesPage;
