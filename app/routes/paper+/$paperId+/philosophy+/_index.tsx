import { PhilosophyV2Screen } from "#app/components/paper-v2/PhilosophyV2Screen";
import {
  generatePhilosophyAi,
  getPhilosophy,
  savePhilosophy,
} from "#app/services/philosophy.server";
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
    await generatePhilosophyAi({
      request,
      paperId,
      ablyEventName: ablyEvent,
      step,
    });
    return json({ ok: true, streaming: true });
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
    if (fetcher.data?.ok && fetcher.data.philosophy) {
      setSavedDraft(Boolean(fetcher.data.philosophy.draft_philosophy?.trim()));
      notifications.show({
        title: "Saved",
        message: "Philosophy saved successfully",
        color: "green",
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
