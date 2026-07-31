import customFetch from "#app/utils/customFetch";

export interface Framework {
  id: number;
  paper_id: string;
  theoretical_framework: string | null;
  mermaid_source: string | null;
  rendered_png_url: string | null;
  citation_nodes: Array<{ nodeId: string; libraryEntryId: number }> | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export const getFramework = async ({
  request,
  paperId,
}: {
  request: Request;
  paperId: string;
}) =>
  customFetch<{ success: boolean; framework: Framework | null }>({
    request,
    url: `/api/papers/${paperId}/framework`,
    method: "get",
  });

export const saveFramework = async ({
  request,
  paperId,
  data,
}: {
  request: Request;
  paperId: string;
  data: Partial<Framework>;
}) =>
  customFetch<{ success: boolean; framework: Framework }>({
    request,
    url: `/api/papers/${paperId}/framework`,
    method: "put",
    data: JSON.stringify(data),
  });

export const renderFramework = async ({
  request,
  paperId,
  mermaidSource,
  svgData,
}: {
  request: Request;
  paperId: string;
  mermaidSource: string;
  svgData?: string;
}) =>
  customFetch<{ success: boolean; rendered_png_url: string | null; framework: Framework }>({
    request,
    url: `/api/papers/${paperId}/framework/render`,
    method: "post",
    data: JSON.stringify({ mermaid_source: mermaidSource, svg_data: svgData }),
  });

export const generateFrameworkTheoreticalAi = async ({
  request,
  paperId,
  ablyEventName,
}: {
  request: Request;
  paperId: string;
  ablyEventName: string;
}) =>
  customFetch({
    request,
    url: "/api/ai/generate-framework-theoretical",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

export const generateFrameworkMermaidAi = async ({
  request,
  paperId,
  ablyEventName,
  theoreticalFramework,
}: {
  request: Request;
  paperId: string;
  ablyEventName: string;
  theoreticalFramework?: string;
}) =>
  customFetch({
    request,
    url: "/api/ai/generate-framework-mermaid",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
      theoretical_framework: theoreticalFramework,
    }),
  });
