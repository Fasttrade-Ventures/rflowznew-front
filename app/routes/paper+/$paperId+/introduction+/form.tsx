import { Icon } from "#app/components/icon";
import { NoSubscriptionEmptyState } from "#app/components/NoSubscriptionEmptyState";
import {
  AddCitationDrawer,
  addCitationSchema,
} from "#app/components/ui/citation/AddCitationDrawer";
import { IntroductionForm } from "#app/components/ui/paper/IntroductionForm";
import { BreadcrumbHandle } from "#app/routes/_index";
import { generateAiIntroduction } from "#app/services/ai.server";
import {
  getCurrentUser,
  requireAuth,
} from "#app/services/authentication.server";
import {
  addCitation,
  getPaperCitationsBySection,
  getPaperIntroduction,
  removeCitationById,
  updateIntroduction,
} from "#app/services/paper.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import { Stack } from "@mantine/core";
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
  await requireAuth({ request });
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const [userRes, introductionRes, citationsRes] = await Promise.all([
      getCurrentUser({ request }),
      getPaperIntroduction({ paperId, request }),
      getPaperCitationsBySection({
        paperId,
        request,
        section: "background_study",
      }),
    ]);

    return json({
      user: userRes.data,
      introduction: introductionRes.data?.introduction,
      citations: citationsRes.data?.citations,
      hasActiveSubscription:
        userRes.data?.subscription_status === "active" ||
        userRes.data?.subscription_status === "trialing",
    });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/introduction`, {
      type: "error",
      title: "Error",
      description: "Error getting introduction",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const ablyEventName = formData.get("ablyEventName");

  const submission = parseWithZod(formData, { schema });

  if (intent === "generateAiResponse") {
    const paperId = formData.get("paperId");
    invariant(paperId, "Paper ID is required");
    await generateAiIntroduction({
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
      section: "background_study" as const,
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

  if (intent === "removeCitation") {
    const paperId = formData.get("paperId") as string;
    const citationId = formData.get("citationId") as string;
    try {
      await removeCitationById({ paperId, request, citationId });
      return json({
        lastResult: null,
        serverError: null,
        success: true,
        toast: {
          type: "success",
          title: `Done remove citation`,
          description: `Citation removed successfully`,
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
          title: `Error`,
          description: `Error`,
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
    await updateIntroduction({
      paperId: submission.value.paperId,
      request,
      introduction: { body: submission.value.body },
    });
    return redirectWithToast(
      `/paper/${submission.value.paperId}/introduction`,
      {
        type: "success",
        description: "Background study has been updated successfully",
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

export const PaperIntroductionEditPage = () => {
  const { paperId } = useParams();
  const data = useLoaderData<typeof loader>();
  const user = data.user;
  const isMendeleyLinked = user?.is_mendeley_linked;
  const actionData = useActionData<typeof action>();
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
    <Stack gap="md">
      {/* <pre style={{ fontSize: 8 }}>{JSON.stringify(citations, null, 2)}</pre> */}
      <AddCitationDrawer
        key={JSON.stringify(citations)}
        closeDrawer={closeCitationDrawer}
        drawerOpened={citationDrawerOpened}
        paperId={paperId!}
        citations={citations}
        isMendeleyLinked={isMendeleyLinked ?? false}
      />

      {/* <AddCitationWithTopicDrawer
        key={JSON.stringify(citations)}
        closeDrawer={closeCitationDrawer}
        drawerOpened={citationDrawerOpened}
        paperId={paperId!}
        citations={citations}
        isMendeleyLinked={isMendeleyLinked ?? false}
      /> */}

      <IntroductionForm
        actionData={actionData}
        paperId={paperId}
        initialBody={data.introduction?.body || ""}
        citations={{
          onAddCitationClick: openCitationDrawer,
          citationData: citations,
        }}
      />
    </Stack>
  );
};

export default PaperIntroductionEditPage;
export type EditIntroductionActionData = SerializeFrom<typeof action>;
