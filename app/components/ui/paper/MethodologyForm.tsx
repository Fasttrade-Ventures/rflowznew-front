import { Box, Stack } from "@mantine/core";
import { PaperProblemStatementSchema } from "#app/routes/paper+/$paperId+/problem-statement+/form";
import { FormSection } from "./FormSection";
import { z } from "zod";
import {
  MethodologyActionData,
  PaperMethodologySchema,
} from "#app/routes/paper+/$paperId+/methodology+/form";
import React from "react";
import CDivider from "../CDivider";
import { ExtendedCitation } from "#app/services/paper.server";
import { CitationBar } from "../citation/CitationBar";

interface MethodologyFormProps {
  actionData: MethodologyActionData;
  paperId: string | undefined;
  initialResearchDesign: string;
  initialDataCollectionMethods: string;
  initialAnalysisTechniques: string;
  initialSoftwareAndTools: string;
  infoContents?: {
    research_design?: string;
    data_collection_methods?: string;
    analysis_techniques?: string;
    software_and_tools?: string;
  };
  citations: {
    onAddCitationClick: () => void;
    citationData: ExtendedCitation[] | undefined;
  };
}

type MethodologyField = keyof z.infer<typeof PaperMethodologySchema>;

export const MethodologyForm: React.FC<MethodologyFormProps> = ({
  actionData,
  paperId,
  initialResearchDesign,
  initialDataCollectionMethods,
  initialAnalysisTechniques,
  initialSoftwareAndTools,
  infoContents = {},
  citations,
}) => {
  const sections: Array<{
    label: string;
    field: MethodologyField;
    initialValue: string;
    infoContent: string;
    generateUrl: string;
  }> = [
    {
      label: "Research Design",
      field: "research_design",
      initialValue: initialResearchDesign,
      infoContent:
        infoContents?.research_design ?? "Default research design info",
      generateUrl: `/paper/${paperId}/methodology/form`,
    },
    {
      label: "Data Collection Methods",
      field: "data_collection_methods",
      initialValue: initialDataCollectionMethods,
      infoContent:
        infoContents?.data_collection_methods ??
        "Default data collection methods info",
      generateUrl: `/paper/${paperId}/methodology/form`,
    },
    {
      label: "Analysis Techniques",
      field: "analysis_techniques",
      initialValue: initialAnalysisTechniques,
      infoContent:
        infoContents?.analysis_techniques ?? "Default analysis techniques info",
      generateUrl: `/paper/${paperId}/methodology/form`,
    },
    {
      label: "Software and Tools",
      field: "software_and_tools",
      initialValue: initialSoftwareAndTools,
      infoContent:
        infoContents?.software_and_tools ?? "Default software and tools info",
      generateUrl: `/paper/${paperId}/methodology/form`,
    },
  ];

  return (
    <Stack>
      <Box pr="md" pl="md">
        <CitationBar
          citations={{
            onAddCitationClick: citations.onAddCitationClick,
            citationData: citations.citationData,
          }}
        />
      </Box>
      <CDivider my="4" />
      {sections.map((section, index) => {
        const pickedSchema = PaperMethodologySchema.pick({
          [section.field]: true,
        } as Record<MethodologyField, true>);

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
                { name: "field", value: section.field },
                { name: "paperId", value: paperId as string },
              ]}
            />
            {index !== sections.length - 1 ? <CDivider /> : null}
          </React.Fragment>
        );
      })}
    </Stack>
  );
};
