/* eslint-disable react/prop-types */
import { z } from "zod";
import { FormSection } from "./FormSection";
import { EditPoDActionData } from "#app/routes/paper+/$paperId+/point-of-departure+/form";

const PoDSchema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

interface PoDFormProps {
  actionData: EditPoDActionData | undefined;
  paperId: string | undefined;
  initialBody: string;
}

export const PoDForm: React.FC<PoDFormProps> = ({
  actionData,
  paperId,
  initialBody,
}) => {
  const section = {
    label: "Point of departure",
    field: "body" as const,
    initialValue: initialBody,
    infoContent: "This is a guide to help you explain the PoD.",
  };

  const generateUrl = `/paper/${paperId}/point-of-departure/form`;

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
      ablyEventName="point-of-departure"
      aiIntentName="generateAiResponse"
    />
  );
};
