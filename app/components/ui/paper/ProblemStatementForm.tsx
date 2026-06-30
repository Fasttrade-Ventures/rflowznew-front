import {
  PaperProblemStatementSchema,
  ProblemStatementActionData,
} from "#app/routes/paper+/$paperId+/problem-statement+/form";
import { z } from "zod";

import { Stack } from "@mantine/core";

import { FormSection } from "./FormSection";
import React from "react";
import CDivider from "../CDivider";
import { ExtendedCitation } from "#app/services/paper.server";

interface ProblemStatementFormProps {
  actionData: ProblemStatementActionData;
  paperId: string | undefined;
  initialMotivationalProblem: string;
  initialGapInPractice: string;
  initialResearchProblem: string;
  initialGapInResearch: string;
  infoContents?: {
    motivational_problem?: string;
    gap_in_practice?: string;
    research_problem?: string;
    gap_in_research?: string;
  };
  motivationalProblemCitations: {
    onAddCitationClick: () => void;
    citationData: ExtendedCitation[] | undefined;
  };
  researchProblemCitations: {
    onAddCitationClick: () => void;
    citationData: ExtendedCitation[] | undefined;
  };
}

type ProblemStatementField = keyof z.infer<typeof PaperProblemStatementSchema>;

export const ProblemStatementForm: React.FC<ProblemStatementFormProps> = ({
  actionData,
  paperId,
  initialMotivationalProblem,
  initialGapInPractice,
  initialResearchProblem,
  initialGapInResearch,
  infoContents = {},
  motivationalProblemCitations,
  researchProblemCitations,
}) => {
  const sections: Array<{
    label: string;
    field: ProblemStatementField;
    initialValue: string;
    infoContent: string;
    generateUrl: string;
  }> = [
    {
      label: "Motivational Problem",
      field: "motivational_problem",
      initialValue: initialMotivationalProblem,
      infoContent:
        infoContents?.motivational_problem ??
        "Default motivational problem info",
      generateUrl: `/paper/${paperId}/problem-statement/form`,
    },
    {
      label: "Gap in Practice",
      field: "gap_in_practice",
      initialValue: initialGapInPractice,
      infoContent:
        infoContents?.gap_in_practice ?? "Default gap in practice info",
      generateUrl: `/paper/${paperId}/problem-statement/form`,
    },
    {
      label: "Research Problem",
      field: "research_problem",
      initialValue: initialResearchProblem,
      infoContent:
        infoContents?.research_problem ?? "Default research problem info",
      generateUrl: `/paper/${paperId}/problem-statement/form`,
    },
    {
      label: "Gap in Research",
      field: "gap_in_research",
      initialValue: initialGapInResearch,
      infoContent:
        infoContents?.gap_in_research ?? "Default gap in research info",
      generateUrl: `/paper/${paperId}/problem-statement/form`,
    },
  ];

  return (
    <Stack>
      {sections.map((section, index) => {
        const pickedSchema = PaperProblemStatementSchema.pick({
          [section.field]: true,
        } as Record<ProblemStatementField, true>);

        const citationsProps =
          section.field === "motivational_problem" ||
          section.field === "research_problem"
            ? {
                citations: {
                  onAddCitationClick:
                    section.field === "motivational_problem"
                      ? motivationalProblemCitations.onAddCitationClick
                      : researchProblemCitations.onAddCitationClick,
                  citationData:
                    section.field === "motivational_problem"
                      ? motivationalProblemCitations.citationData
                      : researchProblemCitations.citationData,
                },
              }
            : {};

        return (
          <React.Fragment key={String(section.field)}>
            <FormSection
              section={section}
              paperId={paperId}
              actionData={actionData}
              schema={pickedSchema}
              generateUrl={section.generateUrl}
              ablyEventName={`problem-statement-${section.field}`}
              aiIntentName="generateAiResponse"
              hiddenInputsForAIGeneration={[
                { name: "field", value: section.field },
              ]}
              {...citationsProps}
            />
            {index !== sections.length - 1 ? <CDivider /> : null}
          </React.Fragment>
        );
      })}
    </Stack>
  );
};
