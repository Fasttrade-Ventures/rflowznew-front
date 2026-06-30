import { Icon } from "#app/components/icon";
import { ResearchSignificantForm } from "#app/components/ui/paper/ResearchSignificantForm";
import { BreadcrumbHandle } from "#app/routes/_index";
import { generateAiResearchSignificant } from "#app/services/ai.server";
import {
  createOrUpdateResearchSignificant,
  getPaperResearchSignificant,
} from "#app/services/paper.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { AuthorizationError } from "remix-auth";
import { z } from "zod";

import { parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@remix-run/node";
import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import { requireAuth } from "#app/services/authentication.server";
import NoSubscriptionEmptyState from "#app/components/NoSubscriptionEmptyState";

export const handle: BreadcrumbHandle = {
  icon: <Icon name="plus-outline" style={{ width: "20px", height: "30px" }} />,
  breadcrumb: "Form",
};

export const PaperResearchSignificantSchema = z.object({
  paperId: z.string(),
  practical_contribution: z.string().min(150).optional(),
  research_contribution: z.string().min(150).optional(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });

  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperResearchSignificant({ paperId, request });
    return json({
      research_significant: res.data?.research_significant,
      success: true,
      toast: null,
      serverError: null,
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
    });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/research-significant`, {
      type: "error",
      title: "Error",
      description: "Error getting research significant",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const submission = parseWithZod(formData, {
    schema: PaperResearchSignificantSchema,
  });

  if (intent === "generateAiResponse") {
    const paperId = formData.get("paperId");
    const field = formData.get("field");
    const ablyEventName = formData.get("ablyEventName");

    invariant(paperId, "Paper ID is required");
    invariant(field, "Field is required");

    try {
      await generateAiResearchSignificant({
        request,
        paperId: paperId as string,
        field: field as string,
        ablyEventName: ablyEventName as string,
      });

      return json({
        lastResult: submission.reply(),
        serverError: null,
        success: true,
        toast: null,
      });
    } catch (error) {
      return json({
        lastResult: submission.reply(),
        serverError: "Error generating AI response",
        success: false,
        toast: null,
      });
    }
  }

  if (submission.status !== "success") {
    return json({
      lastResult: submission.reply(),
      serverError: null,
      success: false,
      toast: null,
    });
  }

  try {
    const res = await createOrUpdateResearchSignificant({
      paperId: submission.value.paperId,
      request,
      research_significant: {
        practical_contribution: submission.value.practical_contribution,
        research_contribution: submission.value.research_contribution,
      },
    });
    return json({
      lastResult: submission.reply(),
      serverError: null,
      success: true,
      toast: {
        type: "success",
        title: `Done ${intent}`,
        description: `${intent} successfully`,
      },
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
        toast: null,
      });
    }

    if (exception && typeof exception === "object" && "data" in exception) {
      console.error(
        "Error details:",
        (exception as any).data?.errors?.error || exception
      );

      return json({
        lastResult: submission.reply({
          formErrors: (exception as any).data?.errors?.error,
        }),
        serverError: null,
        success: false,
        toast: null,
      });
    } else {
      console.error("Unstructured error:", exception);
    }

    throw exception;
  }
};

export const PaperNewResearchSignificantPage = () => {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  const params = useParams();

  if (!loaderData.hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }
  return (
    <ResearchSignificantForm
      actionData={actionData!}
      paperId={params.paperId}
      initialPracticalContribution={
        loaderData.research_significant?.practical_contribution || ""
      }
      initialResearchContribution={
        loaderData.research_significant?.research_contribution || ""
      }
    />
  );
};

export type ResearchSignificantActionData = SerializeFrom<typeof action>;
export default PaperNewResearchSignificantPage;
