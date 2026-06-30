import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditLiteratureReviewActionData } from "#app/routes/paper+/$paperId+/literature-review+/form";
import { ExtendedCitation } from "#app/services/paper.server";

const LiteratureReviewSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface LiteratureReviewFormProps {
  actionData: EditLiteratureReviewActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
  citations: {
    onAddCitationClick: () => void;
    citationData: ExtendedCitation[] | undefined;
  };
}

export const LiteratureReviewForm: React.FC<LiteratureReviewFormProps> = ({
  actionData,
  paperId,
  initialBody,
  citations,
}) => {
  const section = {
    label: "Literature Review",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the LiteratureReview.",
  };

  const generateUrl = `/paper/${paperId}/literature-review/form`;

  const pickedSchema = LiteratureReviewSchema.pick({
    [section.field]: true,
  });

  return (
    <FormSection
      section={section}
      paperId={paperId}
      actionData={actionData}
      schema={pickedSchema}
      generateUrl={generateUrl}
      ablyEventName="literatureReview"
      aiIntentName="generateAiResponse"
      citations={citations}
    />
  );
};
