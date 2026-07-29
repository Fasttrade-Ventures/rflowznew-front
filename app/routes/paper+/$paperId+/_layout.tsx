import { GeneralErrorBoundary } from "#app/components/error-boundary";
import { Icon } from "#app/components/icon";
import { PaperV1Layout } from "#app/components/paper-v2/PaperV1Layout";
import { PaperWorkspaceLayout } from "#app/components/paper-v2/PaperWorkspaceLayout";
import { BreadcrumbHandle } from "#app/routes/_index";
import { getPaper, getPaperProgress } from "#app/services/paper.server";
import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import { getHints } from "#app/utils/client-hints";
import { json, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="user-circle-outline"
      style={{ width: "20px", height: "20px" }}
    />
  ),
  dynamicBreadcrumb(data: SerializeFrom<typeof loader>) {
    return data.paper?.title?.substring(0, 20) + "...";
  },
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const paperId = params.paperId;

  try {
    const [paperRes, progressRes] = await Promise.all([
      getPaper({ paperId: paperId!, request }),
      getPaperProgress({ paperId: paperId!, request }),
    ]);

    const paper = paperRes.data?.paper;
    const progress = progressRes.data?.progress;
    const overallPercentage = progressRes.data?.overall_percentage;
    const simulationV2 = progressRes.data?.simulation_v2;

    return json({
      paper,
      progress,
      overallPercentage,
      simulationV2,
      timeZone: getHints(request).timeZone,
      paperV2Flow: isPaperV2FlowEnabled(),
    });
  } catch {
    throw new Response("Error fetching paper data", { status: 500 });
  }
};

export default function PaperDetailLayout() {
  const data = useLoaderData<typeof loader>();
  const paperId = data.paper?.id?.toString();

  if (data.paperV2Flow && data.paper && paperId) {
    return (
      <PaperWorkspaceLayout
        paperId={paperId}
        paperTitle={data.paper.title}
        paperMethod={data.paper.method}
        paperKeywords={data.paper.keywords}
        progress={
          (data.progress ?? {}) as Record<
            string,
            { completion_percentage: number }
          >
        }
        overallPercentage={data.overallPercentage}
        simulationV2={data.simulationV2}
      >
        <Outlet />
      </PaperWorkspaceLayout>
    );
  }

  return <PaperV1Layout />;
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        403: ({ error }) => (
          <p>You are not allowed to do that: {error?.data}</p>
        ),
      }}
    />
  );
}
