/* eslint-disable react/prop-types */
import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditSolvingTheProblemActionData } from "#app/routes/paper+/$paperId+/solving-the-problem+/form";

const PoDSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface SolvingTheProblemFormProps {
  actionData: EditSolvingTheProblemActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
}

export const SolvingTheProblemForm: React.FC<SolvingTheProblemFormProps> = ({
  actionData,
  paperId,
  initialBody,
}) => {
  const section = {
    label: "Solving the problem",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the Solving the problem.",
  };

  const generateUrl = `/paper/${paperId}/solving-the-problem/form`;

  const pickedSchema = PoDSchema.pick({
    [section.field]: true,
  });

  return (
    <FormSection
      section={section}
      paperId={paperId}
      actionData={actionData}
      schema={pickedSchema}
      generateUrl={generateUrl}
      ablyEventName="solving-the-problem"
      aiIntentName="generateAiResponse"
    />
  );
};
