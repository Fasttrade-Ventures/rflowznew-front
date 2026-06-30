import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditExpertReviewActionData } from "#app/routes/paper+/$paperId+/expert-review+/form";

const ExperimentAnalysisSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface AbstractFormProps {
  actionData: EditExpertReviewActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
}

export const ExperimentAnalysisForm: React.FC<AbstractFormProps> = ({
  actionData,
  paperId,
  initialBody,
}) => {
  const section = {
    label: "Experiment Analysis",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the Experiment Analysis.",
  };

  const generateUrl = `/paper/${paperId}/experiment-analysis/form`;

  const pickedSchema = ExperimentAnalysisSchema.pick({
    [section.field]: true,
  });

  console.log(section);
  return (
    <FormSection
      section={section}
      paperId={paperId}
      actionData={actionData}
      schema={pickedSchema}
      generateUrl={generateUrl}
      aiIntentName="generateAiResponse"
      ablyEventName="experiment-analysis"
    />
  );
};
