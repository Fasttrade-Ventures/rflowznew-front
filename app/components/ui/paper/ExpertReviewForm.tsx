/* eslint-disable react/prop-types */
import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditExpertReviewActionData } from "#app/routes/paper+/$paperId+/expert-review+/form";

const ExpertReviewSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface AbstractFormProps {
  actionData: EditExpertReviewActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
}

export const ExpertReviewForm: React.FC<AbstractFormProps> = ({
  actionData,
  paperId,
  initialBody,
}) => {
  const section = {
    label: "Expert Review",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the Expert Review.",
  };

  const generateUrl = `/paper/${paperId}/expert-review/form`;

  const pickedSchema = ExpertReviewSchema.pick({
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
      ablyEventName="expert-review"
    />
  );
};
