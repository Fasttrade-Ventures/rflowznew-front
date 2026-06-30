import { z } from "zod";

import { Box, Button, Group, Stack, Text } from "@mantine/core";
import classes from "./SubResearchQuestionAndObjectiveForm.module.css";

import {
  ResearchQuestionAndObjectiveActionData,
  SubResearchQuestionAndObjectiveSchema,
} from "#app/routes/paper+/$paperId+/research-questions-and-objectives+/form";
import { useDoubleCheck } from "#app/utils/misc";
import { Form } from "@remix-run/react";
import React, { useState } from "react";
import CDivider from "../CDivider";
import { FormSection } from "./FormSection";

interface SubResearchQuestionAndObjectiveFormProps {
  actionData: ResearchQuestionAndObjectiveActionData;
  paperId: string | undefined;
  order: number;
  initialSubResearchQuestion: string;
  initialSubResearchObjective: string;
  infoContents?: {
    sub_research_question?: string;
    sub_research_objective?: string;
  };
  subResearchQuestionId: number;
}

type SubResearchQuestionAndObjectiveField = keyof z.infer<
  typeof SubResearchQuestionAndObjectiveSchema
>;

export const SubResearchQuestionAndObjectiveForm: React.FC<
  SubResearchQuestionAndObjectiveFormProps
> = ({
  actionData,
  paperId,
  initialSubResearchQuestion,
  initialSubResearchObjective,
  order,
  subResearchQuestionId,
  infoContents = {},
}) => {
  const deleteSubResearchQuestionAndObjectiveAction = useDoubleCheck();
  const [subResearchQuestion, setSubResearchQuestion] = useState<string>(
    initialSubResearchQuestion
  );

  return (
    <Stack>
      <Box className={classes.container}>
        <Box className={classes.header}>
          <Group justify="space-between">
            <Text
              size="md"
              fw={600}
              variant="gradient"
              gradient={{
                from: "var(--mantine-primary-color-filled)",
                to: "var(--mantine-primary-color-8)",
              }}
            >
              Sub Research Question {order}
            </Text>
            {order > 3 ? (
              <Form method="post">
                <input
                  type="hidden"
                  name="subResearchQuestionId"
                  value={subResearchQuestionId}
                />
                <input type="hidden" name="paperId" value={paperId} />
                <Button
                  {...deleteSubResearchQuestionAndObjectiveAction.getButtonProps(
                    {
                      type: "submit",
                      name: "intent",
                      value: "deleteSubResearchQuestionAndObjective",
                    }
                  )}
                  color="red"
                >
                  {deleteSubResearchQuestionAndObjectiveAction.doubleCheck
                    ? "Sure?"
                    : "Delete"}
                </Button>
              </Form>
            ) : (
              <></>
            )}
          </Group>
        </Box>
        <Stack gap="md" mt="md" mb="md">
          <FormSection
            section={{
              label: "Question",
              field: "question",
              initialValue: initialSubResearchQuestion!,
              infoContent:
                infoContents?.sub_research_question ??
                "Default sub research question info",
            }}
            ablyEventName={`sub_research_question_${subResearchQuestionId}`}
            paperId={paperId}
            formId={`sub_research_question_${subResearchQuestionId}`}
            actionData={actionData}
            schema={SubResearchQuestionAndObjectiveSchema}
            generateUrl={`/paper/${paperId}/research-questions-and-objectives/form`}
            onTextAreaChange={(value) => {
              setSubResearchQuestion(value);
            }}
            aiIntentName="gen_ai_sub_research_question"
            saveIntentName="save_sub_research_question"
            hiddenInputsForAIGeneration={[
              {
                name: "subResearchQuestionId",
                value: subResearchQuestionId.toString(),
              },
              {
                name: "subResearchOrder",
                value: order.toString(),
              },
              {
                name: "field",
                value: "question",
              },
            ]}
            hiddenInputsForSave={[
              {
                name: "subResearchQuestionId",
                value: subResearchQuestionId.toString(),
              },
            ]}
          />
          <CDivider
            darkColor="var(--mantine-color-dark-6)"
            lightColor="var(--mantine-color-gray-4)"
          />
          <FormSection
            section={{
              label: "Objective",
              field: "objective",
              initialValue: initialSubResearchObjective!,
              infoContent:
                infoContents?.sub_research_objective ??
                "Default sub research objective info",
            }}
            ablyEventName={`sub_research_objective_${subResearchQuestionId}`}
            paperId={paperId}
            formId={`sub_research_objective_${subResearchQuestionId}`}
            actionData={actionData}
            schema={SubResearchQuestionAndObjectiveSchema}
            generateUrl={`/paper/${paperId}/research-questions-and-objectives/form`}
            aiIntentName="gen_ai_sub_research_objective"
            saveIntentName="save_sub_research_objective"
            hiddenInputsForAIGeneration={[
              {
                name: "subResearchQuestionId",
                value: subResearchQuestionId.toString(),
              },
              {
                name: "subResearchOrder",
                value: order.toString(),
              },
              {
                name: "aiPreContextText",
                value: `The sub research question is: ${subResearchQuestion}`,
              },
              {
                name: "field",
                value: "objective",
              },
            ]}
            hiddenInputsForSave={[
              {
                name: "subResearchQuestionId",
                value: subResearchQuestionId.toString(),
              },
            ]}
          />
        </Stack>
      </Box>
    </Stack>
  );
};
