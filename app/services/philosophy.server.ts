import customFetch from "#app/utils/customFetch";

export interface Philosophy {
  id: number;
  paper_id: string;
  ontology_answers: Record<string, string> | null;
  epistemology_answers: Record<string, string> | null;
  axiology_answers: Record<string, string> | null;
  paradigm: string | null;
  draft_philosophy: string | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export const getPhilosophy = async ({
  request,
  paperId,
}: {
  request: Request;
  paperId: string;
}) =>
  customFetch<{ success: boolean; philosophy: Philosophy | null }>({
    request,
    url: `/api/papers/${paperId}/philosophy`,
    method: "get",
  });

export const savePhilosophy = async ({
  request,
  paperId,
  data,
}: {
  request: Request;
  paperId: string;
  data: Partial<Philosophy>;
}) =>
  customFetch<{ success: boolean; philosophy: Philosophy }>({
    request,
    url: `/api/papers/${paperId}/philosophy`,
    method: "put",
    data: JSON.stringify(data),
  });

export const generatePhilosophyAi = async ({
  request,
  paperId,
  ablyEventName,
  step,
}: {
  request: Request;
  paperId: string;
  ablyEventName: string;
  step?: string;
}) =>
  customFetch({
    request,
    url: "/api/ai/generate-philosophy",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
      step,
    }),
  });
