import {
  FrameworkV2Screen,
  type FrameworkV2FormValues,
} from "#app/components/paper-v2/FrameworkV2Screen";
import { getLibraryEntries } from "#app/services/library.server";
import {
  generateFrameworkMermaidAi,
  generateFrameworkTheoreticalAi,
  getFramework,
  renderFramework,
  saveFramework,
} from "#app/services/framework.server";
import { invariant } from "@epic-web/invariant";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";
import { repairMermaidSource } from "#app/utils/sanitize-mermaid-source";
import {
  getApiErrorMessage,
  getAskProfZErrorTitle,
  isPlanLimitError,
  showAskProfZNotification,
} from "#app/utils/api-error";

const DEFAULT_MERMAID = `flowchart TD
  A[Problem Context] --> B[Constructs]
  B --> C[Methodology]
  C --> D[Expected Outcomes]`;

export function shouldRevalidate({
  formData,
  defaultShouldRevalidate,
}: {
  formData?: FormData;
  defaultShouldRevalidate: boolean;
}) {
  const intent = formData?.get("intent");
  if (
    intent === "save" ||
    intent === "generate-mermaid" ||
    intent === "generate-theoretical"
  ) {
    return false;
  }
  return defaultShouldRevalidate;
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "paperId required");

  const [frameworkRes, libraryRes] = await Promise.all([
    getFramework({ request, paperId }),
    getLibraryEntries({ request, paperId }),
  ]);

  return json({
    paperId,
    framework: frameworkRes.data?.framework ?? null,
    libraryEntries: libraryRes.data?.entries ?? [],
  });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "paperId required");
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    try {
      const data = JSON.parse(
        formData.get("data") as string
      ) as FrameworkV2FormValues;
      const svgData = (formData.get("svg_data") as string) || undefined;

      const saved = await saveFramework({
        request,
        paperId,
        data,
      });

      // Auto-embed diagram in proposal when a preview image was provided.
      if (svgData) {
        try {
          const rendered = await renderFramework({
            request,
            paperId,
            mermaidSource: data.mermaid_source,
            svgData,
          });
          return json({
            saveOk: true,
            framework: rendered.data?.framework ?? saved.data?.framework,
            embedded: true,
          });
        } catch {
          return json({
            saveOk: true,
            framework: saved.data?.framework,
            embedWarning:
              "Framework saved, but the diagram could not be embedded. Preview it again, then save.",
          });
        }
      }

      return json({
        saveOk: true,
        framework: saved.data?.framework,
        embedded: false,
      });
    } catch {
      return json({ saveOk: false, serverError: "Error saving framework" });
    }
  }

  if (intent === "generate-theoretical") {
    try {
      await generateFrameworkTheoreticalAi({
        request,
        paperId,
        ablyEventName: formData.get("ablyEvent") as string,
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

  if (intent === "generate-mermaid") {
    try {
      await generateFrameworkMermaidAi({
        request,
        paperId,
        ablyEventName: formData.get("ablyEvent") as string,
        theoreticalFramework: formData.get("theoretical_framework") as string,
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

function fromFrameworkRecord(
  framework?: {
    theoretical_framework?: string | null;
    mermaid_source?: string | null;
  } | null
): FrameworkV2FormValues {
  return {
    theoretical_framework: framework?.theoretical_framework ?? "",
    mermaid_source: repairMermaidSource(
      framework?.mermaid_source ?? DEFAULT_MERMAID
    ),
  };
}

export default function FrameworksRoute() {
  const { paperId, framework, libraryEntries } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [renderedPngUrl, setRenderedPngUrl] = useState(
    framework?.rendered_png_url ?? null
  );

  const initialValues = useMemo(
    () => fromFrameworkRecord(framework),
    [framework?.theoretical_framework, framework?.mermaid_source]
  );

  const [savedValues, setSavedValues] = useState<FrameworkV2FormValues | null>(
    null
  );

  const screenInitial = savedValues ?? initialValues;

  const isSaving =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") === "save";

  const saveError =
    fetcher.data &&
    "saveOk" in fetcher.data &&
    !fetcher.data.saveOk &&
    "serverError" in fetcher.data
      ? fetcher.data.serverError
      : null;

  const generationError =
    fetcher.data &&
    "ok" in fetcher.data &&
    fetcher.data.ok === false &&
    "serverError" in fetcher.data &&
    typeof fetcher.data.serverError === "string"
      ? fetcher.data.serverError
      : null;

  const generationPlanLimit =
    fetcher.data &&
    "planLimit" in fetcher.data
      ? Boolean(fetcher.data.planLimit)
      : false;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    const data = fetcher.data;

    if ("saveOk" in data) {
      if (data.saveOk && "framework" in data && data.framework) {
        setSavedValues(fromFrameworkRecord(data.framework));
        setRenderedPngUrl(data.framework?.rendered_png_url ?? null);
        if ("embedWarning" in data && data.embedWarning) {
          notifications.show({
            title: "Saved with warning",
            message: String(data.embedWarning),
            color: "yellow",
          });
        } else {
          notifications.show({
            title: "Saved",
            message:
              "embedded" in data && data.embedded
                ? "Framework saved and diagram embedded in the proposal"
                : "Framework saved successfully",
            color: "green",
          });
        }
      } else if ("serverError" in data && data.serverError) {
        notifications.show({
          title: "Error",
          message: data.serverError,
          color: "red",
        });
      }
      return;
    }

    if (
      "ok" in data &&
      data.ok === false &&
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
  }, [fetcher.data, fetcher.state]);

  return (
    <FrameworkV2Screen
      paperId={paperId}
      libraryEntries={libraryEntries}
      initial={screenInitial}
      renderedPngUrl={renderedPngUrl}
      saving={isSaving}
      saveError={saveError}
      generationError={generationError}
      generationPlanLimit={generationPlanLimit}
      onAskProfZTheoretical={(ablyEvent) => {
        const fd = new FormData();
        fd.set("intent", "generate-theoretical");
        fd.set("ablyEvent", ablyEvent);
        fetcher.submit(fd, { method: "post" });
      }}
      onAskProfZMermaid={(ablyEvent, data) => {
        const fd = new FormData();
        fd.set("intent", "generate-mermaid");
        fd.set("ablyEvent", ablyEvent);
        fd.set("theoretical_framework", data.theoretical_framework);
        fetcher.submit(fd, { method: "post" });
      }}
      onSave={(data, svgData) => {
        const fd = new FormData();
        fd.set("intent", "save");
        fd.set("data", JSON.stringify(data));
        if (svgData) fd.set("svg_data", svgData);
        fetcher.submit(fd, { method: "post" });
      }}
    />
  );
}
