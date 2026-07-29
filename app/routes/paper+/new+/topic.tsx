import { NewProjectTopicForm } from "#app/components/v2/NewProjectTopicForm";
import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import { requireAuth } from "#app/services/authentication.server";
import {
  buildRefinedStatement,
  topicSchema,
  type NewProjectDraft,
  type TopicDraft,
} from "#app/utils/new-project-wizard";
import { writeWizardDraftCookie } from "#app/utils/new-project-wizard.server";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth({ request });
  if (!isPaperV2FlowEnabled()) {
    throw redirect("/paper/new/legacy");
  }
  const url = new URL(request.url);
  const purpose = url.searchParams.get("purpose") ?? "masters";
  const rqCount = Number(url.searchParams.get("rqCount") ?? "3");

  return json({
    initial: {
      purpose,
      rqCount,
      topic: "",
      who: "",
      what: "",
      where: "",
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAuth({ request });
  const formData = await request.formData();
  const parsed = topicSchema.safeParse({
    purpose: formData.get("purpose"),
    rqCount: formData.get("rqCount"),
    topic: formData.get("topic"),
    who: formData.get("who"),
    what: formData.get("what"),
    where: formData.get("where"),
  });

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof TopicDraft, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof TopicDraft;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return json({ fieldErrors }, { status: 400 });
  }

  const draft: NewProjectDraft = {
    ...parsed.data,
    refinedStatement: buildRefinedStatement(parsed.data),
  };

  return redirect("/paper/new/review", {
    headers: {
      "Set-Cookie": await writeWizardDraftCookie(draft),
    },
  });
};

export default function NewProjectTopic() {
  const { initial } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return <NewProjectTopicForm initial={initial} actionData={actionData} />;
}
