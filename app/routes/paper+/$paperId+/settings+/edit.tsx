import { Icon } from "#app/components/icon";
import { ProjectSettingsV2Screen } from "#app/components/paper-v2/ProjectSettingsV2Screen";
import PaperForm, { paperSchema } from "#app/components/ui/paper/PaperForm";
import { BreadcrumbHandle } from "#app/routes/_index";
import { getPaper, updatePaper } from "#app/services/paper.server";
import { usePaperV2Flow } from "#app/utils/use-paper-v2-flow";
import { redirectWithToast } from "#app/utils/toast.server";
import { AuthorizationError } from "remix-auth";
import { z } from "zod";

import { parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import { Box } from "@mantine/core";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import { requireAuth } from "#app/services/authentication.server";
import NoSubscriptionEmptyState from "#app/components/NoSubscriptionEmptyState";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon name="settings-outline" style={{ width: "20px", height: "20px" }} />
  ),
  breadcrumb: "Edit",
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  const { paperId } = params;
  invariant(paperId, "paperId is required");
  const res = await getPaper({ request, paperId });

  const returnedPaper = res.data?.paper;

  const validTypes = ["Framework", "System", "Model", "Application"];
  const defaultType = validTypes.includes(returnedPaper!.tangible_output)
    ? returnedPaper!.tangible_output
    : "Others";

  const paper: z.infer<typeof paperSchema> = {
    ...returnedPaper,
    title: returnedPaper?.title ?? "",
    authors: returnedPaper?.authors ?? [],
    keywords: returnedPaper?.keywords ?? [],
    method: returnedPaper?.method ?? "Qualitative", // Add default method
    context: returnedPaper?.context ?? "", // Add default context
    tangibleOutput:
      defaultType === "Others"
        ? { type: "Others", description: returnedPaper?.tangible_output ?? "" }
        : {
            type: defaultType as
              | "Framework"
              | "System"
              | "Model"
              | "Application",
          },
    language: (returnedPaper?.language ?? "en") as "en" | "id" | "ar", // Use language from API or default to English
  };

  return json({
    paper,
    paperMeta: returnedPaper?.meta ?? null,
    hasActiveSubscription:
      user.subscription_status === "active" ||
      user.subscription_status === "trialing",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: paperSchema });

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply(), serverError: null });
  }

  try {
    const res = await updatePaper({
      paper: submission.value,
      request,
      paperId: submission.value.id!,
    });
    return redirectWithToast(`/paper/${submission.value.id}/settings`, {
      type: "success",
      title: "Settings updated",
      description: "Settings updated successfully",
    });
  } catch (exception: unknown) {
    if (exception instanceof Response && exception.status === 302) {
      throw exception;
    }

    if (exception instanceof Response) throw exception;

    if (exception instanceof AuthorizationError) {
      const error = exception as unknown;
      return json({
        serverError: error?.cause?.data?.message,
        lastResult: submission.reply(),
      });
    }

    throw exception;
  }
};

export const EditSettingsPage = () => {
  const { paper, paperMeta, hasActiveSubscription } = useLoaderData<typeof loader>();
  const { paperId } = useParams();
  const actionData = useActionData<typeof action>();
  const isV2 = usePaperV2Flow();

  if (!hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }

  if (isV2) {
    return (
      <ProjectSettingsV2Screen
        initialData={paper}
        paperId={paperId!}
        paperTitle={paper.title}
        paperMeta={paperMeta}
        actionData={actionData}
      />
    );
  }

  return (
    <Box pr="md" pl="md">
      <PaperForm
        initialData={paper}
        isEditing={true}
        paperId={paperId!}
        actionData={actionData}
      />
    </Box>
  );
};

export default EditSettingsPage;
