import { Icon } from "#app/components/icon";
import { ExpectedOutputForm } from "#app/components/ui/paper/ExpectedOutputForm";
import { BreadcrumbHandle } from "#app/routes/_index";
import { generateAiExpectedOutput } from "#app/services/ai.server";
import {
  getPaperExpectedOutput,
  createOrUpdateExpectedOutput,
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
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperExpectedOutput({ paperId, request });

    return json({ expected_output: res.data?.expected_output });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/expected-output`, {
      type: "error",
      title: "Error",
      description: "Error getting expected output",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const submission = parseWithZod(formData, { schema });

  if (intent === "generateAiResponse") {
    const paperId = formData.get("paperId");
    invariant(paperId, "Paper ID is required");
    await generateAiExpectedOutput({
      request,
      paperId: paperId as string,
      ablyEventName: "expected-output",
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
    await createOrUpdateExpectedOutput({
      paperId: submission.value.paperId,
      request,
      body: submission.value.body,
    });
    return redirectWithToast(
      `/paper/${submission.value.paperId}/expected-output`,
      {
        type: "success",
        description: "Expected Output has been updated successfully",
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
      });
    }

    throw exception;
  }
};

export const PaperExpectedOutputFormEditPage = () => {
  const { paperId } = useParams();
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <ExpectedOutputForm
      actionData={actionData}
      paperId={paperId}
      initialBody={data.expected_output?.body || ""}
    />
  );
};

export default PaperExpectedOutputFormEditPage;
export type EditExpectedOutputActionData = SerializeFrom<typeof action>;
