import { createNewPaper } from "#app/services/paper.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { AuthorizationError } from "remix-auth";
import { parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
  SerializeFrom,
} from "@remix-run/node";
import PaperForm, { paperSchema } from "#app/components/ui/paper/PaperForm";
import { aiGenerationSchema } from "#app/components/ui/modal/AIGenerationModal";
import { generateAiTitle } from "#app/services/ai.server";
import { useActionData } from "@remix-run/react";
import { APIValidationError } from "#app/utils/error/api-validation-error";
import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (isPaperV2FlowEnabled()) {
    throw redirect("/paper/new/chat");
  }
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "generateAiResponse") {
    const aiSubmission = parseWithZod(formData, { schema: aiGenerationSchema });

    if (aiSubmission.status !== "success") {
      return json({
        lastResult: aiSubmission.reply(),
        serverError: null,
        success: false,
      });
    }

    try {
      await generateAiTitle({
        request,
        keywords: aiSubmission.value.keywords,
        language: aiSubmission.value.language || "en",
      });

      return json({
        lastResult: aiSubmission.reply(),
        serverError: null,
        success: true,
      });
    } catch (exception: unknown) {
      if (exception instanceof Response) throw exception;

      if (exception instanceof APIValidationError) {
        const message =
          exception.data?.message ||
          "You have reached your plan limit. Please upgrade to continue.";
        return json({
          lastResult: aiSubmission.reply({ formErrors: [message] }),
          serverError: message,
          success: false,
        });
      }

      throw exception;
    }
  }

  const submission = parseWithZod(formData, { schema: paperSchema });

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply(), serverError: null });
  }

  try {
    const res = await createNewPaper({
      paper: submission.value,
      request,
    });
    return redirectWithToast(`/paper/${res.data?.paper.id}`, {
      type: "success",
      title: "Paper has been created",
      description: "Paper has been created successfully",
    });
  } catch (exception: unknown) {
    if (exception instanceof Response) throw exception;

    if (exception instanceof AuthorizationError) {
      const error = exception as { cause?: { data?: { message?: string } } };
      return json({
        serverError: error?.cause?.data?.message,
        lastResult: submission.reply(),
      });
    }

    if (exception instanceof APIValidationError) {
      const message =
        exception.data?.message ||
        "You have reached your plan limit. Please upgrade to continue.";
      return json({
        serverError: message,
        lastResult: submission.reply({ formErrors: [message] }),
      });
    }

    throw exception;
  }
};

export default function NewPaperIndex() {
  const actionData = useActionData<typeof action>();
  return <PaperForm actionData={actionData} />;
}

export type NewPaperData = SerializeFrom<typeof action>;
