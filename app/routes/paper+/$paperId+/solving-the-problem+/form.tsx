import { Icon } from "#app/components/icon";
import { NoSubscriptionEmptyState } from "#app/components/NoSubscriptionEmptyState";
import { SolvingTheProblemForm } from "#app/components/ui/paper/SolvingTheProblemForm";
import { BreadcrumbHandle } from "#app/routes/_index";
import { generateAiSolvingTheProblem } from "#app/services/ai.server";
import { requireAuth } from "#app/services/authentication.server";
import {
  createOrUpdateSolvingTheProblem,
  getPaperSolvingTheProblem,
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
    const res = await getPaperSolvingTheProblem({ paperId, request });

    return json({
      solving_the_problem: res.data?.solving_the_problem,
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
    });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/solving-the-problem`, {
      type: "error",
      title: "Error",
      description: "Error getting Solving the Problem",
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
    invariant(ablyEventName, "Ably event name is required");
    await generateAiSolvingTheProblem({
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
    await createOrUpdateSolvingTheProblem({
      paperId: submission.value.paperId,
      request,
      body: submission.value.body,
    });
    return redirectWithToast(
      `/paper/${submission.value.paperId}/solving-the-problem`,
      {
        type: "success",
        description: "Solving the problem has been updated successfully",
      }
    );
  } catch (exception: unknown) {
    if (exception instanceof Response && exception.status === 302) {
      throw exception;
    }

    if (exception instanceof Response) throw exception;

    if (exception instanceof AuthorizationError) {
      const error = exception as unknown as {
        cause?: { data?: { message?: string } };
      };
      return json({
        serverError: error?.cause?.data?.message,
        lastResult: submission.reply(),
        success: false,
      });
    }

    throw exception;
  }
};

export const PaperPoDFormEditPage = () => {
  const { paperId } = useParams();
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!data.hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }
  return (
    <SolvingTheProblemForm
      actionData={actionData}
      paperId={paperId}
      initialBody={data.solving_the_problem?.body || ""}
    />
  );
};

export default PaperPoDFormEditPage;
export type EditSolvingTheProblemActionData = SerializeFrom<typeof action>;
