import { EditIntroductionActionData } from "#app/routes/paper+/$paperId+/introduction+/form";
import { z } from "zod";
import { FormSection } from "./FormSection";
import { ExtendedCitation } from "#app/services/paper.server";

const IntroductionSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface IntroductionFormProps {
  actionData: EditIntroductionActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
  citations: {
    onAddCitationClick: () => void;
    citationData: ExtendedCitation[] | undefined;
  };
}

export const IntroductionForm: React.FC<IntroductionFormProps> = ({
  actionData,
  paperId,
  initialBody,
  citations,
}) => {
  const section = {
    label: "Background study",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the introduction.",
  };

  const generateUrl = `/paper/${paperId}/introduction/form`;

  const pickedSchema = IntroductionSchema.pick({
    [section.field]: true,
  });

  return (
    <FormSection
      section={section}
      paperId={paperId}
      actionData={actionData}
      schema={pickedSchema}
      generateUrl={generateUrl}
      ablyEventName="introduction"
      aiIntentName="generateAiResponse"
      citations={citations}
    />
  );
};
