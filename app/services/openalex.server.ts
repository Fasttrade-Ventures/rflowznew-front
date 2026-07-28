import customFetch from "#app/utils/customFetch";

export interface OpenAlexAuthor {
  first_name?: string;
  last_name: string;
}

export interface OpenAlexCite {
  authors: OpenAlexAuthor[];
  year: number | null;
  title: string;
  source: string | null;
  doi: string | null;
  reference_type: "openalex";
  openalex_id: string;
}

export interface OpenAlexWork {
  openalex_id: string;
  doi: string | null;
  title: string;
  abstract: string;
  authors: OpenAlexAuthor[];
  year: number | null;
  venue: string | null;
  work_type: string | null;
  cited_by_count: number;
  is_open_access: boolean;
  referenced_works: string[];
  score: number;
  cite: OpenAlexCite;
}

export interface OpenAlexSuggestion {
  work: OpenAlexWork;
  reason: string;
}

interface OpenAlexSuggestResponse {
  success: boolean;
  message?: string;
  topic?: string;
  suggestions: OpenAlexSuggestion[];
}

interface OpenAlexSearchResponse {
  success: boolean;
  message?: string;
  query?: string;
  works: OpenAlexWork[];
}

const suggestOpenAlexCitations = async ({
  request,
  paperId,
  section,
  keywords,
}: {
  request: Request;
  paperId: string;
  section?: string;
  keywords?: string[];
}) => {
  const res = await customFetch<OpenAlexSuggestResponse>({
    request,
    url: `/api/papers/${paperId}/academic/suggestions`,
    method: "post",
    data: JSON.stringify({ section, keywords }),
  });

  return res;
};

const searchOpenAlexCitations = async ({
  request,
  paperId,
  q,
}: {
  request: Request;
  paperId: string;
  q: string;
}) => {
  const res = await customFetch<OpenAlexSearchResponse>({
    request,
    url: `/api/papers/${paperId}/academic/search`,
    method: "post",
    data: JSON.stringify({ q }),
  });

  return res;
};

export { suggestOpenAlexCitations, searchOpenAlexCitations };
