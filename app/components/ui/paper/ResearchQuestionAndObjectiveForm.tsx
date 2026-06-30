import {
  ResearchQuestionAndObjectiveActionData,
  ResearchQuestionAndObjectiveSchema,
  SubResearchQuestionAndObjectiveSchema,
} from "#app/routes/paper+/$paperId+/research-questions-and-objectives+/form";
import React from "react";
import { z } from "zod";

import { Box, Button, Stack, Text } from "@mantine/core";
import { Form } from "@remix-run/react";

import CDivider from "../CDivider";
import { FormSection } from "./FormSection";
import classes from "./ResearchQuestionAndObjectiveForm.module.css";
import { SubResearchQuestionAndObjectiveForm } from "./SubResearchQuestionAndObjectiveForm";

interface ResearchQuestionAndObjectiveFormProps {
  actionData: ResearchQuestionAndObjectiveActionData;
  paperId: string | undefined;
  initialMainResearchQuestion: string;
  initialSubResearchQuestions: {
    id: number;
    question: string;
    objective: string;
    order: number;
  }[];
  infoContents?: {
    main_research_question?: string;
    sub_research_question?: string;
    sub_research_objective?: string;
  };
}

export const ResearchQuestionAndObjectiveForm: React.FC<
  ResearchQuestionAndObjectiveFormProps
> = ({
  actionData,
  paperId,
  initialMainResearchQuestion,
  initialSubResearchQuestions,
  infoContents = {},
}) => {
  return (
    <Stack>
      <FormSection
        section={{
          label: "Main Research Question",
          field: "main_research_question",
          initialValue: initialMainResearchQuestion,
          infoContent:
            infoContents?.main_research_question ??
            "Default main research question info",
        }}
        aiIntentName="gen_ai_main_research_question"
        saveIntentName="save_main_research_question"
        ablyEventName="main_research_question"
        paperId={paperId}
        actionData={actionData}
        schema={ResearchQuestionAndObjectiveSchema}
        generateUrl={`/paper/${paperId}/research-questions-and-objectives/form`}
      />

      <Box>
        <CDivider />
        <Text fw={700} size="lg" mt="lg" mb="sm" ml="md" ta="center">
          Sub Research Questions and Objectives
        </Text>
        <Stack gap={0}>
          {initialSubResearchQuestions.map((subResearchQuestion) => (
            <Box className={classes.container} key={subResearchQuestion.id}>
              <SubResearchQuestionAndObjectiveForm
                actionData={actionData}
                order={subResearchQuestion.order}
                paperId={paperId}
                subResearchQuestionId={subResearchQuestion.id}
                initialSubResearchQuestion={subResearchQuestion.question}
                initialSubResearchObjective={subResearchQuestion.objective}
              />
            </Box>
          ))}
        </Stack>
      </Box>
      <Box pr="xs" pl="xs">
        <Form method="post">
          <input type="hidden" name="paperId" value={paperId} />
          <Button
            fullWidth
            type="submit"
            name="intent"
            value="addSubResearchQuestionAndObjective"
            variant="light"
          >
            Add sub research question and objective
          </Button>
        </Form>
      </Box>
    </Stack>
  );
};
