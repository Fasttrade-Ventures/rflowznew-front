import customFetch from "#app/utils/customFetch";
import type { ChatWizardSource } from "#app/utils/prof-zz-chat";

export async function chatWizardResearchSearch({
  request,
  query,
}: {
  request: Request;
  query: string;
}) {
  return customFetch<{
    success: boolean;
    message?: string;
    results?: ChatWizardSource[];
  }>({
    request,
    url: "/api/chat-wizard/research-search",
    method: "post",
    data: JSON.stringify({ query }),
  });
}

export async function chatWizardFinalize({
  request,
  payload,
}: {
  request: Request;
  payload: {
    purpose: string;
    rq_count: number;
    topic: string;
    focus?: string;
    refined_statement: string;
    language?: string;
    sources?: ChatWizardSource[];
  };
}) {
  return customFetch<{
    success: boolean;
    paper?: { id: string };
    introduction?: string;
    sources_saved?: number;
    message?: string;
  }>({
    request,
    url: "/api/chat-wizard/finalize",
    method: "post",
    data: JSON.stringify(payload),
  });
}
