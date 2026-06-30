/* eslint-disable react/prop-types */
import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditExpertReviewActionData } from "#app/routes/paper+/$paperId+/expert-review+/form";

const ReliabilitySchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface AbstractFormProps {
  actionData: EditExpertReviewActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
  paper_method: "Qualitative" | "Quantitative" | "Mixed";
}

export const ReliabilityForm: React.FC<AbstractFormProps> = ({
  actionData,
  paper_method,
  paperId,
  initialBody,
}) => {
  const section = {
    label:
      paper_method === "Quantitative"
        ? "Reliability"
        : paper_method === "Qualitative"
        ? "Trustworthiness"
        : "Reliability & Trustworthiness",
    field: "body" as const,
    initialValue: initialBody,
    infoContent:
      "This is a guide to help you explain the " +
      (paper_method === "Quantitative"
        ? "Reliability"
        : paper_method === "Qualitative"
        ? "Trustworthiness"
        : "Reliability & Trustworthiness"),
  };

  const generateUrl = `/paper/${paperId}/reliability/form`;

  const pickedSchema = ReliabilitySchema.pick({
    [section.field]: true,
  });

  return (
    <FormSection
      section={section}
      paperId={paperId}
      actionData={actionData}
      schema={pickedSchema}
      generateUrl={generateUrl}
      aiIntentName="generateAiResponse"
      ablyEventName="reliability"
    />
  );
};
