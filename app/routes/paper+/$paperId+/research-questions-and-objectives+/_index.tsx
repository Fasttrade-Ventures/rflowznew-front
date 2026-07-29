import { Icon } from "#app/components/icon";
import { ResearchQuestionsV2Read } from "#app/components/paper-v2/ResearchQuestionsV2Screen";
import { PaperPanel, PaperV2Page } from "#app/components/paper-v2/PaperV2Screens";
import CDivider from "#app/components/ui/CDivider";
import {
  getPaper,
  getPaperResearchQuestionsAndObjectives,
} from "#app/services/paper.server";
import { usePaperV2Flow } from "#app/utils/use-paper-v2-flow";
import { getHints } from "#app/utils/client-hints";
import { redirectWithToast } from "#app/utils/toast.server";
import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import { isRqV2Complete } from "#app/utils/research-questions-v2";
import { toRqFormValues } from "#app/routes/paper+/$paperId+/research-questions-and-objectives+/rq-v2.server";
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
  const isV2 = isPaperV2FlowEnabled();
  try {
    const [res, paperRes] = await Promise.all([
      getPaperResearchQuestionsAndObjectives({
        paperId,
        request,
      }),
      getPaper({ paperId, request }),
    ]);
    const paperMeta = paperRes.data?.paper?.meta ?? null;
    const rqValues = toRqFormValues(
      res.data?.research_question_and_objective ?? null
    );
    const complete = isV2
      ? isRqV2Complete(paperMeta, rqValues)
      : res.data?.research_question_and_objective.completion_percentage === 100;

    if (!complete) {
      return redirect(
        `/paper/${paperId}/research-questions-and-objectives/form`
      );
    }
    return json({
      ...res.data,
      paperMeta,
      rqValues,
      timeZone: getHints(request).timeZone,
    });
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
  const isV2 = usePaperV2Flow();
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

  const editButton = (
    <Button
      leftSection={
        <Icon name="pencil-outline" style={{ width: 16, height: 16 }} />
      }
      variant="light"
      size="xs"
      component={Link}
      to={`/paper/${data?.research_question_and_objective?.paper_id}/research-questions-and-objectives/form`}
    >
      Edit
    </Button>
  );

  const subCards =
    data?.research_question_and_objective?.sub_research_question_and_objectives.map(
      (subResearchQuestionAndObjective) =>
        isV2 ? (
          <PaperPanel
            key={subResearchQuestionAndObjective.id}
            title={`Sub RQ ${subResearchQuestionAndObjective.order}`}
          >
            <Stack gap="sm">
              <Text size="xs" fw={600}>
                Question
              </Text>
              <FormattedText content={subResearchQuestionAndObjective.question!} />
              <Text size="xs" fw={600}>
                Objective
              </Text>
              <FormattedText content={subResearchQuestionAndObjective.objective!} />
            </Stack>
          </PaperPanel>
        ) : (
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
    );

  const body = (
    <>
      {!isV2 && (
        <>
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
            {editButton}
          </Group>
          <CDivider />
        </>
      )}
      {isV2 ? (
        <ResearchQuestionsV2Read
          meta={data.paperMeta}
          values={data.rqValues}
        />
      ) : (
        <>
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
            <Stack>{subCards}</Stack>
          </Box>
        </>
      )}
    </>
  );

  if (isV2) {
    return (
      <PaperV2Page
        title="Research questions"
        subtitle={`Created ${createdAt} · Updated ${updatedAt}`}
        guide="Broad RQs mapped to TreZ (review), TAM (empirical), and builder (artifact)."
        profZ="These are research questions — broad inquiries. Interview questions live beneath RQ2, later."
        actions={editButton}
      >
        <ResearchQuestionsV2Read
          meta={data.paperMeta}
          values={data.rqValues}
        />
      </PaperV2Page>
    );
  }

  return <Stack>{body}</Stack>;
};

export default ResearchQuestionsAndObjectivesPage;
