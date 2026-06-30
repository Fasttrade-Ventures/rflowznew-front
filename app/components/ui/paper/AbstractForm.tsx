import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditAbstractActionData } from "#app/routes/paper+/$paperId+/review-proposal+/abstract+/_index";

const AbstractSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface AbstractFormProps {
  actionData: EditAbstractActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
}

export const AbstractForm: React.FC<AbstractFormProps> = ({
  actionData,
  paperId,
  initialBody,
}) => {
  const section = {
    label: "Abstract",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the Abstract.",
  };

  const generateUrl = `/paper/${paperId}/review-proposal/abstract?index`;

  const pickedSchema = AbstractSchema.pick({
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
      ablyEventName="review-proposal"
    />
  );
};
