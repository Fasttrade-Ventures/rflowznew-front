import { PhilosophyV2Screen } from "#app/components/paper-v2/PhilosophyV2Screen";
import {
  generatePhilosophyAi,
  getPhilosophy,
  savePhilosophy,
  type Philosophy,
} from "#app/services/philosophy.server";
import {
  getApiErrorMessage,
  getAskProfZErrorTitle,
  isPlanLimitError,
  showAskProfZNotification,
} from "#app/utils/api-error";
import { invariant } from "@epic-web/invariant";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "paperId required");
  const res = await getPhilosophy({ request, paperId });
  return json({ paperId, philosophy: res.data?.philosophy ?? null });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "paperId required");
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const payload = JSON.parse(formData.get("data") as string);
    const res = await savePhilosophy({ request, paperId, data: payload });
    return json({ ok: true, philosophy: res.data?.philosophy });
  }

  if (intent === "ask-prof-z") {
    const step = formData.get("step") as string;
    const ablyEvent = formData.get("ablyEvent") as string;
    try {
      await generatePhilosophyAi({
        request,
        paperId,
        ablyEventName: ablyEvent,
        step,
      });
      return json({ ok: true, streaming: true });
    } catch (error) {
      return json({
        ok: false,
        serverError: getApiErrorMessage(error),
        planLimit: isPlanLimitError(error),
        errorTitle: getAskProfZErrorTitle(error),
      });
    }
  }

  return json({ ok: false });
};

export default function PhilosophyRoute() {
  const { paperId, philosophy } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [savedDraft, setSavedDraft] = useState(
    Boolean(philosophy?.draft_philosophy?.trim())
  );

  useEffect(() => {
    const data = fetcher.data;
    if (!data) return;

    if (data.ok && "philosophy" in data && data.philosophy) {
      const savedPhilosophy = data.philosophy as Philosophy;
      setSavedDraft(Boolean(savedPhilosophy.draft_philosophy?.trim()));
      notifications.show({
        title: "Saved",
        message: "Philosophy saved successfully",
        color: "green",
      });
      return;
    }

    if (
      !data.ok &&
      "serverError" in data &&
      typeof data.serverError === "string" &&
      data.serverError
    ) {
      showAskProfZNotification({
        message: data.serverError,
        planLimit: "planLimit" in data ? Boolean(data.planLimit) : false,
        title:
          "errorTitle" in data && typeof data.errorTitle === "string"
            ? data.errorTitle
            : undefined,
      });
    }
  }, [fetcher.data]);

  return (
    <PhilosophyV2Screen
      paperId={paperId}
      savedDraft={savedDraft}
      initial={{
        ontology_answers: philosophy?.ontology_answers ?? null,
        epistemology_answers: philosophy?.epistemology_answers ?? null,
        axiology_answers: philosophy?.axiology_answers ?? null,
        paradigm: philosophy?.paradigm ?? "",
        draft_philosophy: philosophy?.draft_philosophy ?? "",
      }}
      saving={fetcher.state !== "idle"}
      generationError={
        fetcher.data &&
        !fetcher.data.ok &&
        "serverError" in fetcher.data &&
        typeof fetcher.data.serverError === "string"
          ? fetcher.data.serverError
          : null
      }
      generationPlanLimit={
        fetcher.data &&
        !fetcher.data.ok &&
        "planLimit" in fetcher.data
          ? Boolean(fetcher.data.planLimit)
          : false
      }
      onAskProfZ={(step, ablyEvent) => {
        const fd = new FormData();
        fd.set("intent", "ask-prof-z");
        fd.set("step", step);
        fd.set("ablyEvent", ablyEvent);
        fetcher.submit(fd, { method: "post" });
      }}
      onSave={(data) => {
        const fd = new FormData();
        fd.set("intent", "save");
        fd.set("data", JSON.stringify(data));
        fetcher.submit(fd, { method: "post" });
      }}
    />
  );
}
