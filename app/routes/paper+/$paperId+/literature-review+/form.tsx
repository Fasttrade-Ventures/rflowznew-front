import { Icon } from "#app/components/icon";
import NoSubscriptionEmptyState from "#app/components/NoSubscriptionEmptyState";
import {
  AddCitationWithTopicDrawer,
  addCitationWithTopicsSchema,
} from "#app/components/ui/citation/AddCitationWihTopicDrawer";
import { LiteratureReviewForm } from "#app/components/ui/paper/LiteratureReviewForm";
import { BreadcrumbHandle } from "#app/routes/_index";
import { generateAiLiteratureReview } from "#app/services/ai.server";
import {
  getCurrentUser,
  requireAuth,
} from "#app/services/authentication.server";
import {
  addCitation,
  createOrUpdateLiteratureReview,
  getPaperCitationsBySection,
  getPaperLiteratureReview,
} from "#app/services/paper.server";
import { redirectWithToast } from "#app/utils/toast.server";
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
    const [userRes, literatureReviewRes, citationsRes] = await Promise.all([
      getCurrentUser({ request }),
      getPaperLiteratureReview({ paperId, request }),
      getPaperCitationsBySection({
        paperId,
        request,
        section: "literature_review",
      }),
    ]);

    return json({
      user: userRes.data,
      literature_review: literatureReviewRes.data?.literature_review,
      citations: citationsRes.data?.citations,
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
    });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/literature-review`, {
      type: "error",
      title: "Error",
      description: "Error getting Literature Review",
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
    await generateAiLiteratureReview({
      request,
      paperId: paperId as string,
      ablyEventName: ablyEventName as string,
    });

    return json({
      lastResult: submission.reply(),
      serverError: null,
      success: true,
      toast: {
        type: "success",
        title: `Done generate AI response`,
        description: `AI response generated successfully`,
      },
    });
  }

  if (intent === "addCitation") {
    const paperId = formData.get("paperId") as string;
    console.log("1.Masukk sini 🔥");

    const citationsSubmission = parseWithZod(formData, {
      schema: addCitationWithTopicsSchema,
    });

    if (citationsSubmission.status !== "success") {
      console.log("2.Masukk sini 🔥", citationsSubmission.reply());
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

    const citations = citationsSubmission.value.topics.flatMap((topic) =>
      topic.statements.map((statement) => ({
        id: statement.id,
        statement_text: statement.text,
        section: "literature_review" as const,
        topic: topic.name,
        cites: statement.cites,
      }))
    );

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
      toast: {
        type: "error",
        title: `Error`,
        description: `Error`,
      },
    });
  }

  try {
    await createOrUpdateLiteratureReview({
      paperId: submission.value.paperId,
      request,
      body: submission.value.body,
    });
    return redirectWithToast(
      `/paper/${submission.value.paperId}/literature-review`,
      {
        type: "success",
        description: "Literature Review has been updated successfully",
      }
    );
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
        toast: {
          type: "error",
          title: `Error`,
          description: `Error`,
        },
      });
    }

    throw exception;
  }
};

export const PaperLiteratureReviewFormEditPage = () => {
  const { paperId } = useParams();
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const user = data.user;
  const isMendeleyLinked = user?.is_mendeley_linked;

  const [
    citationDrawerOpened,
    { open: openCitationDrawer, close: closeCitationDrawer },
  ] = useDisclosure(false);

  React.useEffect(() => {
    if (actionData?.success) {
      if (actionData.toast) {
        notifications.show({
          title: actionData.toast.title,
          message: actionData.toast.description,
        });
      }
      closeCitationDrawer();
    }
  }, [actionData]);

  const citations = data.citations;

  if (!data.hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }

  return (
    <>
      <AddCitationWithTopicDrawer
        key={JSON.stringify(citations)}
        closeDrawer={closeCitationDrawer}
        drawerOpened={citationDrawerOpened}
        paperId={paperId!}
        citations={citations}
        isMendeleyLinked={isMendeleyLinked ?? false}
      />
      <LiteratureReviewForm
        actionData={actionData}
        paperId={paperId}
        initialBody={data.literature_review?.body || ""}
        citations={{
          onAddCitationClick: openCitationDrawer,
          citationData: citations,
        }}
      />
    </>
  );
};

export default PaperLiteratureReviewFormEditPage;
export type EditLiteratureReviewActionData = SerializeFrom<typeof action>;
