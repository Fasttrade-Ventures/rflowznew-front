import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditExpectedOutputActionData } from "#app/routes/paper+/$paperId+/expected-output+/form";

const ExpectedOutputSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface ExpectedOutputFormProps {
  actionData: EditExpectedOutputActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
}

export const ExpectedOutputForm: React.FC<ExpectedOutputFormProps> = ({
  actionData,
  paperId,
  initialBody,
}) => {
  const section = {
    label: "ExpectedOutput",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the Expected Output.",
  };

  const generateUrl = `/paper/${paperId}/expected-output/form`;

  const pickedSchema = ExpectedOutputSchema.pick({
    [section.field]: true,
  });

  return (
    <FormSection
      section={section}
      paperId={paperId}
      actionData={actionData}
      schema={pickedSchema}
      generateUrl={generateUrl}
      ablyEventName="expected-output"
      aiIntentName="generateAiResponse"
    />
  );
};
