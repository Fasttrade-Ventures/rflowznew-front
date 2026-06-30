import { Icon } from "#app/components/icon";
import NoSubscriptionEmptyState from "#app/components/NoSubscriptionEmptyState";
import { ExperimentAnalysisForm } from "#app/components/ui/paper/ExperimentAnalysis";
import { BreadcrumbHandle } from "#app/routes/_index";
import { generateAiExperimentAnalysis } from "#app/services/ai.server";
import { requireAuth } from "#app/services/authentication.server";
import {
  createOrUpdateExperimentAnalysis,
  getPaperExperimentAnalysis,
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
    const res = await getPaperExperimentAnalysis({ paperId, request });

    return json({
      experiment_analysis: res.data?.experiment_analysis,
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
    });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/experiment-analysis`, {
      type: "error",
      title: "Error",
      description: "Error getting Experiment Analysis",
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
    await generateAiExperimentAnalysis({
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
    await createOrUpdateExperimentAnalysis({
      paperId: submission.value.paperId,
      request,
      body: submission.value.body,
    });
    return redirectWithToast(
      `/paper/${submission.value.paperId}/experiment-analysis`,
      {
        type: "success",
        description: "Experiment Analysis has been updated successfully",
      }
    );
  } catch (exception: unknown) {
    return redirectWithToast(
      `/paper/${submission.value.paperId}/experiment-analysis`,
      {
        type: "error",
        description: "Error updating Experiment Analysis",
      }
    );
  }
};

export const PaperExperimentAnalysisFormEditPage = () => {
  const { paperId } = useParams();
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!data.hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }

  return (
    <ExperimentAnalysisForm
      actionData={actionData}
      paperId={paperId}
      initialBody={data.experiment_analysis?.body || ""}
    />
  );
};

export default PaperExperimentAnalysisFormEditPage;
export type EditExperimentAnalysisActionData = SerializeFrom<typeof action>;
