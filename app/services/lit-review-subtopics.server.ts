import { customFetch } from "#app/utils/fetch.server";

export type LitReviewSubtopic = {
  id: string;
  paper_id: string;
  order: number;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
};

export const getLitReviewSubtopics = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  return customFetch<{ subtopics: LitReviewSubtopic[] }>({
    request,
    url: `/api/papers/${paperId}/lit-review-subtopics`,
    method: "get",
  });
};

export const createLitReviewSubtopic = async ({
  paperId,
  title,
  order,
  request,
}: {
  paperId: string;
  title: string;
  order?: number;
  request: Request;
}) => {
  return customFetch<{ subtopic: LitReviewSubtopic }>({
    request,
    url: `/api/papers/${paperId}/lit-review-subtopics`,
    method: "post",
    data: JSON.stringify({ title, order }),
  });
};

export const updateLitReviewSubtopic = async ({
  paperId,
  subtopicId,
  data,
  request,
}: {
  paperId: string;
  subtopicId: string;
  data: Partial<Pick<LitReviewSubtopic, "title" | "body" | "order">>;
  request: Request;
}) => {
  return customFetch<{ subtopic: LitReviewSubtopic }>({
    request,
    url: `/api/papers/${paperId}/lit-review-subtopics/${subtopicId}`,
    method: "put",
    data: JSON.stringify(data),
  });
};

export const deleteLitReviewSubtopic = async ({
  paperId,
  subtopicId,
  request,
}: {
  paperId: string;
  subtopicId: string;
  request: Request;
}) => {
  return customFetch<{ message: string }>({
    request,
    url: `/api/papers/${paperId}/lit-review-subtopics/${subtopicId}`,
    method: "delete",
  });
};

export const suggestLitSubtopics = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  return customFetch<{ titles: string[] }>({
    request,
    url: "/api/ai/suggest-lit-subtopics",
    method: "post",
    data: JSON.stringify({ paper_id: paperId }),
  });
};

export const generateLitSubtopicBody = async ({
  paperId,
  subtopicId,
  ablyEventName,
  request,
}: {
  paperId: string;
  subtopicId: string;
  ablyEventName: string;
  request: Request;
}) => {
  return customFetch<{ message: string }>({
    request,
    url: "/api/ai/generate-lit-subtopic-body",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      subtopic_id: subtopicId,
      ably_event_name: ablyEventName,
    }),
  });
};
