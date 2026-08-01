import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "#app/routes/_index";
import {
  addCitation,
  createOrUpdateMethodology,
  getPaperCitationsBySection,
  getPaperMethodology,
} from "#app/services/paper.server";
import {
  fromMethodologyRecord,
  toMethodologyPayload,
  type MethodologyV2FormValues,
} from "#app/utils/methodology-v2";
import { redirectWithToast } from "#app/utils/toast.server";
import { AuthorizationError } from "remix-auth";
import { z } from "zod";

import { parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { generateAiMethodology } from "#app/services/ai.server";
import { MethodologyForm } from "#app/components/ui/paper/MethodologyForm";
import { useDisclosure } from "@mantine/hooks";
import React, { useEffect, useMemo } from "react";
import { notifications } from "@mantine/notifications";
import {
  getCurrentUser,
  requireAuth,
} from "#app/services/authentication.server";
import {
  AddCitationDrawer,
  addCitationSchema,
} from "#app/components/ui/citation/AddCitationDrawer";
import { MethodologyV2Screen } from "#app/components/paper-v2/MethodologyV2Screen";
import NoSubscriptionEmptyState from "#app/components/NoSubscriptionEmptyState";
import { getCoherence } from "#app/services/coherence.server";
import { getPhilosophy } from "#app/services/philosophy.server";
import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";

export const handle: BreadcrumbHandle = {
  icon: <Icon name="plus-outline" style={{ width: "20px", height: "30px" }} />,
  breadcrumb: "Form",
};

export function shouldRevalidate({
  formData,
  defaultShouldRevalidate,
}: {
  formData?: FormData;
  defaultShouldRevalidate: boolean;
}) {
  const intent = formData?.get("intent");
  if (intent === "generateAiResponse") {
    return false;
  }
  return defaultShouldRevalidate;
}

export const PaperMethodologySchema = z.object({
  paperId: z.string(),
  research_design: z.string().min(150).optional(),
  data_collection_methods: z.string().min(150).optional(),
  analysis_techniques: z.string().min(150).optional(),
  software_and_tools: z.string().min(150).optional(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const [userRes, methodologyRes, citationsRes, coherenceRes, philosophyRes] =
      await Promise.all([
      getCurrentUser({ request }),
      getPaperMethodology({ paperId, request }),
      getPaperCitationsBySection({
        paperId,
        request,
        section: "methodology",
      }),
      isPaperV2FlowEnabled()
        ? getCoherence({ request, paperId })
        : Promise.resolve({ data: { warnings: [] } }),
      isPaperV2FlowEnabled()
        ? getPhilosophy({ request, paperId })
        : Promise.resolve({ data: { philosophy: null } }),
    ]);

    return json({
      user: userRes.data,
      methodology: methodologyRes.data?.methodology,
      citations: citationsRes.data?.citations,
      coherence: coherenceRes.data ?? null,
      philosophy: philosophyRes.data?.philosophy,
      paperV2Flow: isPaperV2FlowEnabled(),
      hasActiveSubscription:
        user.subscription_status === "active" ||
        user.subscription_status === "trialing",
    });
  } catch (error) {
    return redirectWithToast(`/paper/${paperId}/methodology`, {
      type: "error",
      title: "Error",
      description: "Error getting methodology",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save_all_v2") {
    const paperId = formData.get("paperId");
    invariant(paperId, "Paper ID is required");
    const payload = JSON.parse(formData.get("data") as string) as MethodologyV2FormValues;
    try {
      const res = await createOrUpdateMethodology({
        paperId: paperId as string,
        request,
        methodology: toMethodologyPayload(payload),
      });
      return json({
        saveOk: true,
        methodology: res.data?.methodology,
      });
    } catch (error) {
      return json({
        saveOk: false,
        serverError: "Error saving methodology",
      });
    }
  }

  const submission = parseWithZod(formData, {
    schema: PaperMethodologySchema,
  });

  if (intent === "generateAiResponse") {
    const paperId = formData.get("paperId");
    const field = formData.get("field");
    const ablyEventName = formData.get("ablyEventName");

    invariant(paperId, "Paper ID is required");
    invariant(field, "Field is required");
    invariant(ablyEventName, "Ably event name is required");
    try {
      await generateAiMethodology({
        request,
        paperId: paperId as string,
        field: field as string,
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
    } catch (error) {
      return json({
        lastResult: submission.reply(),
        serverError: "Error generating AI response",
        success: false,
        toast: {
          type: "error",
          title: `Error`,
          description: `Error generating AI response`,
        },
      });
    }
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
      section: "methodology" as const,
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
      toast: {
        type: "error",
        title: `Error adding citations`,
        description: `Error adding citations`,
      },
    });
  }

  try {
    const res = await createOrUpdateMethodology({
      paperId: submission.value.paperId,
      request,
      methodology: {
        research_design: submission.value.research_design,
        data_collection_methods: submission.value.data_collection_methods,
        analysis_techniques: submission.value.analysis_techniques,
        software_and_tools: submission.value.software_and_tools,
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
        toast: {
          type: "error",
          title: `Error adding citations`,
          description: `Error adding citations`,
        },
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
        toast: {
          type: "error",
          title: `Error adding citations`,
          description: `Error adding citations`,
        },
      });
    } else {
      console.error("Unstructured error:", exception);
    }

    throw exception;
  }
};

export const PaperNewMethodologyPage = () => {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const params = useParams();

  const initialValues = useMemo(
    () => fromMethodologyRecord(loaderData.methodology),
    [loaderData.methodology]
  );

  const [
    citationDrawerOpened,
    { open: openCitationDrawer, close: closeCitationDrawer },
  ] = useDisclosure(false);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || !("saveOk" in fetcher.data)) {
      return;
    }
    if (fetcher.data.saveOk) {
      notifications.show({
        title: "Saved",
        message: "Methodology saved successfully",
        color: "green",
      });
      return;
    }
    if ("serverError" in fetcher.data && fetcher.data.serverError) {
      notifications.show({
        title: "Error",
        message: fetcher.data.serverError,
        color: "red",
      });
    }
  }, [fetcher.data, fetcher.state]);

  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      if ("toast" in actionData && actionData.toast) {
        notifications.show({
          title: actionData.toast.title,
          message: actionData.toast.description,
        });
      }
      closeCitationDrawer();
    }
  }, [actionData, closeCitationDrawer]);

  const isSaving =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "save_all_v2";

  const saveError =
    fetcher.data &&
    "saveOk" in fetcher.data &&
    !fetcher.data.saveOk &&
    "serverError" in fetcher.data
      ? fetcher.data.serverError
      : null;

  if (!loaderData.hasActiveSubscription) {
    return <NoSubscriptionEmptyState />;
  }

  if (loaderData.paperV2Flow) {
    return (
      <MethodologyV2Screen
        paperId={params.paperId!}
        philosophyParadigm={loaderData.philosophy?.paradigm}
        initial={initialValues}
        saving={isSaving}
        saveError={saveError}
        onAskProfZ={(ablyEvent) => {
          const fd = new FormData();
          fd.set("intent", "generateAiResponse");
          fd.set("paperId", params.paperId!);
          fd.set("field", "research_design");
          fd.set("ablyEventName", ablyEvent);
          fetcher.submit(fd, { method: "post" });
        }}
        onSave={(data) => {
          const fd = new FormData();
          fd.set("intent", "save_all_v2");
          fd.set("paperId", params.paperId!);
          fd.set("data", JSON.stringify(data));
          fetcher.submit(fd, { method: "post" });
        }}
      />
    );
  }

  const citations = loaderData.citations;

  return (
    <>
      <AddCitationDrawer
        key={JSON.stringify(citations)}
        closeDrawer={closeCitationDrawer}
        drawerOpened={citationDrawerOpened}
        paperId={params.paperId!}
        citations={citations}
      />
      <MethodologyForm
        actionData={actionData!}
        paperId={params.paperId}
        initialResearchDesign={loaderData.methodology?.research_design || ""}
        initialDataCollectionMethods={
          loaderData.methodology?.data_collection_methods || ""
        }
        initialAnalysisTechniques={
          loaderData.methodology?.analysis_techniques || ""
        }
        initialSoftwareAndTools={
          loaderData.methodology?.software_and_tools || ""
        }
        citations={{
          onAddCitationClick: openCitationDrawer,
          citationData: citations,
        }}
      />
    </>
  );
};

export type MethodologyActionData = SerializeFrom<typeof action>;
export default PaperNewMethodologyPage;
