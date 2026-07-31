import PaperForm, { paperSchema } from "#app/components/ui/paper/PaperForm";
import { aiGenerationSchema } from "#app/components/ui/modal/AIGenerationModal";
import { generateAiTitle } from "#app/services/ai.server";
import { createNewPaper } from "#app/services/paper.server";
import { requireAuth } from "#app/services/authentication.server";
import { APIValidationError } from "#app/utils/error/api-validation-error";
import { redirectWithToast } from "#app/utils/toast.server";
import { parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { AuthorizationError } from "remix-auth";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  if (user.subscription_status === "inactive") {
    return redirectWithToast("/subscription", {
      type: "error",
      title: "Subscription inactive",
      description:
        "Your subscription is inactive. Please choose a plan to continue.",
    });
  }
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "generateAiResponse") {
    const aiSubmission = parseWithZod(formData, { schema: aiGenerationSchema });
    if (aiSubmission.status !== "success") {
      return json({ lastResult: aiSubmission.reply(), serverError: null, success: false });
    }
    await generateAiTitle({
      request,
      keywords: aiSubmission.value.keywords,
      language: aiSubmission.value.language || "en",
    });
    return json({ lastResult: aiSubmission.reply(), serverError: null, success: true });
  }

  const submission = parseWithZod(formData, { schema: paperSchema });
  if (submission.status !== "success") {
    return json({ lastResult: submission.reply(), serverError: null });
  }

  try {
    const res = await createNewPaper({ paper: submission.value, request });
    return redirectWithToast(`/paper/${res.data?.paper.id}`, {
      type: "success",
      title: "Paper has been created",
      description: "Paper has been created successfully",
    });
  } catch (exception: unknown) {
    if (exception instanceof Response) throw exception;
    if (exception instanceof AuthorizationError) {
      const error = exception as { cause?: { data?: { message?: string } } };
      return json({ serverError: error?.cause?.data?.message, lastResult: submission.reply() });
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

export default function LegacyNewPaper() {
  const actionData = useActionData<typeof action>();
  return <PaperForm actionData={actionData} formAction="/paper/new/legacy" />;
}
