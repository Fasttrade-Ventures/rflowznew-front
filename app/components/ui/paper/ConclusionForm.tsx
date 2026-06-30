import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditConclusionActionData } from "#app/routes/paper+/$paperId+/conclusion+/form";

const ConclusionSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface ConclusionFormProps {
  actionData: EditConclusionActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
}

export const ConclusionForm: React.FC<ConclusionFormProps> = ({
  actionData,
  paperId,
  initialBody,
}) => {
  const section = {
    label: "Conclusion",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the Conclusion.",
  };

  const generateUrl = `/paper/${paperId}/conclusion/form`;

  const pickedSchema = ConclusionSchema.pick({
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
      ablyEventName="conclusion"
      aiIntentName="generateAiResponse"
    />
  );
};
