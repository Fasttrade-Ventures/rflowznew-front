import { Icon } from "#app/components/icon";
import { ResearchQuestionsV2Screen } from "#app/components/paper-v2/ResearchQuestionsV2Screen";
import { BreadcrumbHandle } from "#app/routes/_index";
import {
  addSubResearchQuestionAndObjective,
  deleteSubResearchQuestionAndObjective,
  getPaper,
  getPaperResearchQuestionsAndObjectives,
  updatePaperSubResearchQuestionOrObjective,
} from "#app/services/paper.server";
import { usePaperV2Flow } from "#app/utils/use-paper-v2-flow";
import {
  getApiErrorMessage,
  getAskProfZErrorTitle,
  isPlanLimitError,
} from "#app/utils/api-error";
import { redirectWithToast } from "#app/utils/toast.server";
import { z } from "zod";

import { parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@remix-run/node";
import type { ShouldRevalidateFunctionArgs } from "@remix-run/react";
import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import { ResearchQuestionAndObjectiveForm } from "#app/components/ui/paper/ResearchQuestionAndObjectiveForm";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import {
  generateMainResearchQuestionAI,
  generateSubResearchQuestionOrObjectiveAI,
  saveMainResearchQuestion,
} from "./_utils.server";
import {
  ensureRqSubSlots,
  saveAllResearchQuestionsV2,
  toRqFormValues,
} from "./rq-v2.server";
import type { PaperSimulationMeta } from "#app/utils/research-questions-v2";
import { requireAuth } from "#app/services/authentication.server";
import NoSubscriptionEmptyState from "#app/components/NoSubscriptionEmptyState";

export const handle: BreadcrumbHandle = {
  icon: <Icon name="plus-outline" style={{ width: "20px", height: "30px" }} />,
  breadcrumb: "Form",
};

export function shouldRevalidate({
  formData,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  const intent = formData?.get("intent");
  if (
    intent === "gen_ai_main_research_question" ||
    intent === "gen_ai_sub_research_question" ||
    intent === "gen_ai_sub_research_objective"
  ) {
    return false;
  }
  return defaultShouldRevalidate;
}

export const ResearchQuestionAndObjectiveSchema = z.object({
  paperId: z.string().min(1),
  main_research_question: z.string().min(10),
});

export const SubResearchQuestionAndObjectiveSchema = z.object({
  question: z.string().min(10).optional(),
  objective: z.string().min(10).optional(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const paperRes = await getPaper({ paperId, request });
    const meta = paperRes.data?.paper?.meta ?? null;

    const ensured = await ensureRqSubSlots({ paperId, request, meta });

    return json({
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
      researchQuestionAndObjective: ensured.researchQuestionAndObjective,
      paperMeta: meta,
      rqCount: ensured.rqCount,
      rqValues: toRqFormValues(ensured.researchQuestionAndObjective ?? null),
    });
  } catch (error) {
    return redirectWithToast(
      `/paper/${paperId}/research-questions-and-objectives`,
      {
        type: "error",
        title: "Error",
        description: "Error getting research questions and objectives",
      }
    );
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save_all_v2") {
    const paperId = formData.get("paperId");
    const mainResearchQuestion = String(
      formData.get("main_research_question") ?? ""
    );
    invariant(paperId, "Paper ID is required");

    const subs: Array<{ id: number; question: string }> = [];
    for (const [key, value] of formData.entries()) {
      const match = key.match(/^sub_question_(\d+)$/);
      if (match) {
        subs.push({
          id: Number(match[1]),
          question: String(value),
        });
      }
    }

    if (mainResearchQuestion.trim().length < 10) {
      return json({
        lastResult: null,
        serverError: "RQ1 must be at least 10 characters.",
        success: false,
        toast: null,
      });
    }

    try {
      await saveAllResearchQuestionsV2({
        request,
        paperId: paperId as string,
        mainResearchQuestion,
        subs,
      });
      return json({
        lastResult: null,
        serverError: null,
        success: true,
        toast: {
          type: "success",
          title: "Saved",
          description: "Research questions saved successfully",
        },
      });
    } catch (error) {
      return json({
        lastResult: null,
        serverError: "Error saving research questions",
        success: false,
        toast: null,
      });
    }
  }

  if (intent === "addSubResearchQuestionAndObjective") {
    const paperId = formData.get("paperId");
    invariant(paperId, "Paper ID is required");
    try {
      await addSubResearchQuestionAndObjective({
        paperId: paperId as string,
        request,
      });
      return json({
        lastResult: null,
        serverError: null,
        success: true,
        toast: {
          type: "success",
          title: "Sub research question and objective added",
          description: "Sub research question and objective added successfully",
        },
      });
    } catch (error) {
      return json({
        lastResult: null,
        serverError: "Error adding sub research question and objective",
        success: false,
        toast: {
          type: "error",
          title: "Error",
          description: "Error adding sub research question and objective",
        },
      });
    }
  }

  if (intent === "deleteSubResearchQuestionAndObjective") {
    const paperId = formData.get("paperId");
    const subResearchQuestionId = formData.get("subResearchQuestionId");
    invariant(paperId, "Paper ID is required");
    invariant(subResearchQuestionId, "Sub research question ID is required");
    try {
      await deleteSubResearchQuestionAndObjective({
        paperId: paperId as string,
        subResearchQuestionId: subResearchQuestionId as string,
        request,
      });
      return json({
        lastResult: null,
        serverError: null,
        toast: {
          type: "success",
          title: "Sub research question and objective deleted",
          description:
            "Sub research question and objective deleted successfully",
        },
        success: true,
      });
    } catch (error) {
      return json({
        lastResult: null,
        serverError: "Error adding sub research question and objective",
        toast: {
          type: "error",
          title: "Error",
          description: "Error deleting sub research question and objective",
        },
        success: false,
      });
    }
  }

  if (intent === "gen_ai_main_research_question") {
    const paperId = formData.get("paperId");
    const ablyEventName = formData.get("ablyEventName");
    invariant(paperId, "Paper ID is required");
    invariant(ablyEventName, "Event name is required");
    try {
      await generateMainResearchQuestionAI({
        request,
        paperId: paperId as string,
        ablyEventName: ablyEventName as string,
      });

      return json({
        lastResult: null,
        serverError: null,
        success: true,
        toast: null,
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      return json({
        lastResult: {
          error: {
            "": [message],
          },
          value: null,
          submittedData: formData,
        },
        serverError: message,
        success: false,
        planLimit: isPlanLimitError(error),
        toast: {
          type: "error",
          title: getAskProfZErrorTitle(error),
          description: message,
        },
      });
    }
  }

  if (intent === "save_main_research_question") {
    const submission = parseWithZod(formData, {
      schema: ResearchQuestionAndObjectiveSchema,
    });

    if (submission.status !== "success") {
      return json({
        lastResult: submission.reply(),
        serverError: null,
        success: false,
        toast: null,
      });
    }
    const paperId = formData.get("paperId");
    const mainResearchQuestion = formData.get("main_research_question");
    invariant(paperId, "Paper ID is required");
    invariant(mainResearchQuestion, "Main research question is required");
    try {
      await saveMainResearchQuestion({
        request,
        paperId: paperId as string,
        mainResearchQuestion: mainResearchQuestion as string,
      });
      return json({
        lastResult: submission.reply(),
        serverError: null,
        success: true,
        toast: {
          type: "success",
          title: "Main research question saved",
          description: "Main research question saved successfully",
        },
      });
    } catch (error) {
      return json({
        lastResult: {
          ...submission.reply(),
          error: {
            main_research_question: ["Error saving main research question"],
          },
        },
        serverError: "Error saving main research question",
        success: false,
        toast: null,
      });
    }
  }

  if (
    intent === "save_sub_research_question" ||
    intent === "save_sub_research_objective"
  ) {
    const questionOrObjectiveSubmission = parseWithZod(formData, {
      schema: SubResearchQuestionAndObjectiveSchema,
    });

    if (questionOrObjectiveSubmission.status !== "success") {
      return json({
        lastResult: questionOrObjectiveSubmission.reply(),
        serverError: null,
        success: false,
        toast: null,
      });
    }
    const paperId = formData.get("paperId");
    const subResearchQuestionId = formData.get("subResearchQuestionId");

    console.log("SUB RESEARCH QUESTION ID", subResearchQuestionId);

    try {
      await updatePaperSubResearchQuestionOrObjective({
        request,
        paperId: paperId as string,
        subResearchQuestionId: subResearchQuestionId as string,
        updateData: {
          question: questionOrObjectiveSubmission.value.question,
          objective: questionOrObjectiveSubmission.value.objective,
        },
      });
      return json({
        lastResult: questionOrObjectiveSubmission.reply(),
        serverError: null,
        success: true,
        toast: {
          type: "success",
          title: `Sub research ${
            intent === "save_sub_research_question" ? "question" : "objective"
          } saved`,
          description: `Sub research ${
            intent === "save_sub_research_question" ? "question" : "objective"
          } saved successfully`,
        },
      });
    } catch (error) {
      return json({
        lastResult: {
          ...questionOrObjectiveSubmission.reply(),
          error: {
            ...questionOrObjectiveSubmission.reply().error,
            [intent === "save_sub_research_question"
              ? "question"
              : "objective"]: [
              `Error saving sub research ${
                intent === "save_sub_research_question"
                  ? "question"
                  : "objective"
              }`,
            ],
          },
        },
        serverError: "Error saving main research question",
        success: false,
        toast: null,
      });
    }
  }

  if (
    intent === "gen_ai_sub_research_question" ||
    intent === "gen_ai_sub_research_objective"
  ) {
    const paperId = formData.get("paperId");
    const subResearchQuestionId = formData.get("subResearchQuestionId");
    const subResearchOrder = formData.get("subResearchOrder");

    const ablyEventName = formData.get("ablyEventName");
    const aiPreContextText = formData.get("aiPreContextText");
    const field = formData.get("field");

    invariant(paperId, "Paper ID is required");
    invariant(ablyEventName, "Event name is required");
    invariant(subResearchQuestionId, "Sub research question ID is required");

    try {
      await generateSubResearchQuestionOrObjectiveAI({
        request,
        paperId: paperId as string,
        ablyEventName: ablyEventName as string,
        subResearchQuestionId: subResearchQuestionId as string,
        subResearchOrder: subResearchOrder as string,
        field: field as string,
        ...(intent === "gen_ai_sub_research_objective"
          ? { aiPreContextText: aiPreContextText as string }
          : {}),
      });

      return json({
        lastResult: null,
        serverError: null,
        success: true,
        toast: null,
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      return json({
        lastResult: {
          error: {
            "": [message],
          },
          value: null,
          submittedData: formData,
        },
        serverError: message,
        success: false,
        planLimit: isPlanLimitError(error),
        toast: {
          type: "error",
          title: getAskProfZErrorTitle(error),
          description: message,
        },
      });
    }
  }

  const submission = parseWithZod(formData, {
    schema: ResearchQuestionAndObjectiveSchema,
  });

  if (submission.status !== "success") {
    return json({
      lastResult: submission.reply(),
      serverError: null,
      success: false,
      toast: null,
    });
  }
};

export const PaperNewIntroductionPage = () => {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const isV2 = usePaperV2Flow();

  const params = useParams();
  useEffect(() => {
    if (actionData?.toast) {
      notifications.show({
        title: actionData.toast.title,
        message: actionData.toast.description,
      });
    }
  }, [actionData]);

  if (!loaderData.hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }

  if (isV2) {
    return (
      <ResearchQuestionsV2Screen
        paperId={params.paperId!}
        formUrl={`/paper/${params.paperId}/research-questions-and-objectives/form`}
        actionData={actionData}
        meta={loaderData.paperMeta as PaperSimulationMeta | null}
        initialValues={loaderData.rqValues}
      />
    );
  }

  return (
    <ResearchQuestionAndObjectiveForm
      actionData={actionData!}
      paperId={params.paperId}
      initialMainResearchQuestion={
        loaderData.researchQuestionAndObjective?.main_research_question || ""
      }
      initialSubResearchQuestions={
        loaderData.researchQuestionAndObjective
          ?.sub_research_question_and_objectives || []
      }
    />
  );
};

export type ResearchQuestionAndObjectiveActionData = SerializeFrom<
  typeof action
>;
export default PaperNewIntroductionPage;
