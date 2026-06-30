import { Stack } from "@mantine/core";
import { PaperProblemStatementSchema } from "#app/routes/paper+/$paperId+/problem-statement+/form";
import { FormSection } from "./FormSection";
import { z } from "zod";
import {
  ResearchSignificantActionData,
  PaperResearchSignificantSchema,
} from "#app/routes/paper+/$paperId+/research-significant+/form";
import React from "react";
import CDivider from "../CDivider";

interface ResearchSignificantFormProps {
  actionData: ResearchSignificantActionData;
  paperId: string | undefined;
  initialPracticalContribution: string;
  initialResearchContribution: string;
  infoContents?: {
    practical_conbtribution?: string;
    research_conbtribution?: string;
  };
}

type ResearchSignificantField = keyof z.infer<
  typeof PaperResearchSignificantSchema
>;

export const ResearchSignificantForm: React.FC<
  ResearchSignificantFormProps
> = ({
  actionData,
  paperId,
  initialPracticalContribution,
  initialResearchContribution,
  infoContents = {},
}) => {
  const sections: Array<{
    label: string;
    field: ResearchSignificantField;
    initialValue: string;
    infoContent: string;
    generateUrl: string;
  }> = [
    {
      label: "Practical Contribution",
      field: "practical_contribution",
      initialValue: initialPracticalContribution,
      infoContent:
        infoContents?.practical_conbtribution ?? "Default research design info",
      generateUrl: `/paper/${paperId}/research-significant/form`,
    },
    {
      label: "Research Contribution",
      field: "research_contribution",
      initialValue: initialResearchContribution,
      infoContent:
        infoContents?.research_conbtribution ??
        "Default data collection methods info",
      generateUrl: `/paper/${paperId}/research-significant/form`,
    },
  ];

  return (
    <Stack>
      {sections.map((section, index) => {
        const pickedSchema = PaperResearchSignificantSchema.pick({
          [section.field]: true,
        } as Record<ResearchSignificantField, true>);

        return (
          <React.Fragment key={String(section.field)}>
            <FormSection
              section={section}
              paperId={paperId}
              actionData={actionData}
              schema={pickedSchema}
              generateUrl={section.generateUrl}
              ablyEventName={section.field}
              aiIntentName="generateAiResponse"
              hiddenInputsForAIGeneration={[
                {
                  name: "field",
                  value: section.field,
                },
              ]}
            />
            {index !== sections.length - 1 ? <CDivider /> : null}
          </React.Fragment>
        );
      })}
    </Stack>
  );
};
