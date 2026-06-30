import { Icon } from "#app/components/icon";
import NoSubscriptionEmptyState from "#app/components/NoSubscriptionEmptyState";
import { ConclusionForm } from "#app/components/ui/paper/ConclusionForm";
import { BreadcrumbHandle } from "#app/routes/_index";
import { generateAiConclusion } from "#app/services/ai.server";
import { requireAuth } from "#app/services/authentication.server";
import {
  createOrUpdateConclusion,
  getPaperConclusion,
} from "#app/services/paper.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@remix-run/node";
import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import { AuthorizationError } from "remix-auth";
import { z } from "zod";

const schema = z.object({
  body: z.string().min(150),
  paperId: z.string(),
});

export const handle: BreadcrumbHandle = {
  icon: <Icon name="plus-outline" style={{ width: "20px", height: "30px" }} />,
  breadcrumb: "Edit",
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperConclusion({ paperId, request });

    return json({
      conclusion: res.data?.conclusion,
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
    });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/conclusion`, {
      type: "error",
      title: "Error",
      description: "Error getting Conclusion",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const submission = parseWithZod(formData, { schema });

  if (intent === "generateAiResponse") {
    const paperId = formData.get("paperId");
    const ablyEventName = formData.get("ablyEventName");
    invariant(paperId, "Paper ID is required");
    await generateAiConclusion({
      request,
      paperId: paperId as string,
      ablyEventName: ablyEventName as string,
    });

    return json({
      lastResult: submission.reply(),
      serverError: null,
      success: true,
    });
  }

  if (submission.status !== "success") {
    return json({
      lastResult: submission.reply(),
      serverError: null,
      success: false,
    });
  }

  try {
    await createOrUpdateConclusion({
      paperId: submission.value.paperId,
      request,
      body: submission.value.body,
    });
    return redirectWithToast(`/paper/${submission.value.paperId}/conclusion`, {
      type: "success",
      description: "Conclusion has been updated successfully",
    });
  } catch (exception: unknown) {
    if (exception instanceof Response && exception.status === 302) {
      throw exception;
    }

    if (exception instanceof Response) throw exception;

    if (exception instanceof AuthorizationError) {
      const error = exception as any;
      return json({
        serverError: error?.cause?.data?.message,
        lastResult: submission.reply(),
        success: false,
      });
    }

    throw exception;
  }
};

export const PaperConclusionFormEditPage = () => {
  const { paperId } = useParams();
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!data.hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }

  return (
    <ConclusionForm
      actionData={actionData}
      paperId={paperId}
      initialBody={data.conclusion?.body || ""}
    />
  );
};

export default PaperConclusionFormEditPage;
export type EditConclusionActionData = SerializeFrom<typeof action>;
