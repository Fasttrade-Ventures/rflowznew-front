import { Icon } from "#app/components/icon";
import { ProblemStatementForm } from "#app/components/ui/paper/ProblemStatementForm";
import { BreadcrumbHandle } from "#app/routes/_index";
import {
  addCitation,
  createOrUpdateProblemStatement,
  getPaperCitationsBySection,
  getPaperProblemStatement,
} from "#app/services/paper.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { AuthorizationError } from "remix-auth";
import { z } from "zod";

import {
  AddCitationDrawer,
  addCitationSchema,
} from "#app/components/ui/citation/AddCitationDrawer";
import { generateAiProblemStatement } from "#app/services/ai.server";
import {
  getCurrentUser,
  requireAuth,
} from "#app/services/authentication.server";
import { parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@remix-run/node";
import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import React from "react";
import NoSubscriptionEmptyState from "#app/components/NoSubscriptionEmptyState";

export const handle: BreadcrumbHandle = {
  icon: <Icon name="plus-outline" style={{ width: "20px", height: "30px" }} />,
  breadcrumb: "Form",
};

export const PaperProblemStatementSchema = z.object({
  paperId: z.string(),
  motivational_problem: z.string().min(150).optional(),
  gap_in_practice: z.string().min(150).optional(),
  research_problem: z.string().min(150).optional(),
  gap_in_research: z.string().min(150).optional(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });

  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const [
      userRes,
      problemStatementRes,
      motivationalProblemCitationsRes,
      researchProblemCitationsRes,
    ] = await Promise.all([
      getCurrentUser({ request }),
      getPaperProblemStatement({ paperId, request }),
      getPaperCitationsBySection({
        paperId,
        request,
        section: "motivational_problem",
      }),
      getPaperCitationsBySection({
        paperId,
        request,
        section: "research_problem",
      }),
    ]);

    return json({
      user: userRes.data,
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
      problemStatement: problemStatementRes.data?.problem_statement,
      motivationalProblemCitations:
        motivationalProblemCitationsRes.data?.citations,
      researchProblemCitations: researchProblemCitationsRes.data?.citations,
    });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/problem-statement`, {
      type: "error",
      title: "Error",
      description: "Error getting problem statement",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const submission = parseWithZod(formData, {
    schema: PaperProblemStatementSchema,
  });

  if (intent === "generateAiResponse") {
    const paperId = formData.get("paperId");
    const field = formData.get("field");
    const ablyEventName = formData.get("ablyEventName");
    invariant(paperId, "Paper ID is required");
    invariant(field, "Field is required");
    try {
      await generateAiProblemStatement({
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

  if (
    intent === "addMotivationalProblemCitation" ||
    intent === "addResearchProblemCitation"
  ) {
    const paperId = formData.get("paperId") as string;

    const citationsSubmission = parseWithZod(formData, {
      schema: addCitationSchema,
    });

    if (citationsSubmission.status !== "success") {
      return json({
        lastResult: citationsSubmission.reply(),
        serverError: null,
        success: false,
        toast: {
          type: "error",
          title: `Error`,
          description: `Error`,
        },
      });
    }

    const citations = citationsSubmission.value.statement.map((statement) => ({
      ...statement,
      statement_text: statement.text,
      section:
        intent === "addMotivationalProblemCitation"
          ? ("motivational_problem" as const)
          : ("research_problem" as const),
    }));

    try {
      await addCitation({
        paperId,
        request,
        citations,
      });

      return json({
        lastResult: null,
        serverError: null,
        success: true,
        toast: {
          type: "success",
          title: `Done add citations`,
          description: `Citations added successfully`,
        },
      });
    } catch (error) {
      console.log("ERROR 🔥🔥🔥🔥", error);
      return json({
        lastResult: null,
        serverError: null,
        success: false,
        toast: {
          type: "error",
          title: `Error adding citations`,
          description: `Error adding citations`,
        },
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

  console.log("submission.value 🔥🔥🔥🔥", submission.value);

  try {
    const res = await createOrUpdateProblemStatement({
      paperId: submission.value.paperId,
      request,
      problemStatement: {
        motivational_problem: submission.value.motivational_problem,
        gap_in_practice: submission.value.gap_in_practice,
        research_problem: submission.value.research_problem,
        gap_in_research: submission.value.gap_in_research,
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

export const PaperNewIntroductionPage = () => {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  const params = useParams();

  const user = loaderData.user;

  const [
    motivationalProblemCitationDrawerOpened,
    {
      open: openMotivationalProblemCitationDrawer,
      close: closeMotivationalProblemCitationDrawer,
    },
  ] = useDisclosure(false);
  const [
    researchProblemCitationDrawerOpened,
    {
      open: openResearchProblemCitationDrawer,
      close: closeResearchProblemCitationDrawer,
    },
  ] = useDisclosure(false);

  React.useEffect(() => {
    if (actionData?.success) {
      if (actionData.toast) {
        notifications.show({
          title: actionData.toast.title,
          message: actionData.toast.description,
        });
      }
      closeMotivationalProblemCitationDrawer();
      closeResearchProblemCitationDrawer();
    }
  }, [actionData]);

  const motivationalProblemCitations = loaderData.motivationalProblemCitations;
  const researchProblemCitations = loaderData.researchProblemCitations;

  if (!loaderData.hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }

  return (
    <>
      <AddCitationDrawer
        key={JSON.stringify(motivationalProblemCitations) + "motivational"}
        closeDrawer={closeMotivationalProblemCitationDrawer}
        drawerOpened={motivationalProblemCitationDrawerOpened}
        paperId={params.paperId!}
        citations={motivationalProblemCitations}
        addCitationIntent="addMotivationalProblemCitation"
      />
      <AddCitationDrawer
        key={JSON.stringify(researchProblemCitations) + "research"}
        closeDrawer={closeResearchProblemCitationDrawer}
        drawerOpened={researchProblemCitationDrawerOpened}
        paperId={params.paperId!}
        citations={researchProblemCitations}
        addCitationIntent="addResearchProblemCitation"
      />
      <ProblemStatementForm
        actionData={actionData!}
        paperId={params.paperId}
        initialMotivationalProblem={
          loaderData.problemStatement?.motivational_problem || ""
        }
        initialGapInPractice={
          loaderData.problemStatement?.gap_in_practice || ""
        }
        initialResearchProblem={
          loaderData.problemStatement?.research_problem || ""
        }
        initialGapInResearch={
          loaderData.problemStatement?.gap_in_research || ""
        }
        motivationalProblemCitations={{
          onAddCitationClick: openMotivationalProblemCitationDrawer,
          citationData: motivationalProblemCitations,
        }}
        researchProblemCitations={{
          onAddCitationClick: openResearchProblemCitationDrawer,
          citationData: researchProblemCitations,
        }}
      />
    </>
  );
};

export type ProblemStatementActionData = SerializeFrom<typeof action>;
export default PaperNewIntroductionPage;
