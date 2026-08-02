import customFetch from "#app/utils/customFetch";
import type { OpenAlexAuthor } from "#app/services/openalex.server";

export type LibraryCite = {
  authors: OpenAlexAuthor[];
  year: number | null;
  title: string;
  source: string | null;
  doi?: string | null;
  openalex_id?: string | null;
  reference_type?: "openalex" | "manual" | "web" | string;
  month?: number | null;
  day?: number | null;
  url?: string | null;
  volume?: string | null;
  issue?: string | null;
  first_page?: string | null;
  last_page?: string | null;
};

export interface LibraryEntry {
  id: number;
  user_id: number | null;
  paper_id: string | null;
  kind: "academic" | "web";
  title: string;
  source: string | null;
  url: string | null;
  year: number | null;
  openalex_id: string | null;
  cite: LibraryCite | null;
  summary: string | null;
  is_cited: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  published_date: string | null;
  author: string | null;
  summary: string | null;
  highlights: string[];
}

interface LibraryListResponse {
  success: boolean;
  entries: LibraryEntry[];
}

interface LibraryStoreResponse {
  success: boolean;
  entry: LibraryEntry;
  message?: string;
}

interface ResearchSearchResponse {
  success: boolean;
  message?: string;
  results?: WebSearchResult[];
}

export interface IntegritySection {
  section: string;
  status: string;
  summary?: {
    total: number;
    matched: number;
    unknown: number;
    unsupported: number;
    ambiguous?: number;
  };
  verified_at?: string | null;
}

interface IntegrityResponse {
  success: boolean;
  overall: "pass" | "fail" | "pending" | "not_run";
  sections: IntegritySection[];
  message?: string;
}

const getLibraryEntries = async ({
  request,
  paperId,
}: {
  request: Request;
  paperId: string;
}) =>
  customFetch<LibraryListResponse>({
    request,
    url: `/api/papers/${paperId}/library`,
    method: "get",
  });

const getUserLibraryEntries = async ({ request }: { request: Request }) =>
  customFetch<LibraryListResponse>({
    request,
    url: `/api/library`,
    method: "get",
  });

const saveLibraryEntry = async ({
  request,
  paperId,
  entry,
}: {
  request: Request;
  paperId: string;
  entry: Partial<LibraryEntry> & Record<string, unknown>;
}) =>
  customFetch<LibraryStoreResponse>({
    request,
    url: `/api/papers/${paperId}/library`,
    method: "post",
    data: JSON.stringify(entry),
  });

const updateLibraryEntry = async ({
  request,
  paperId,
  entryId,
  patch,
}: {
  request: Request;
  paperId: string;
  entryId: number | string;
  patch: Record<string, unknown>;
}) =>
  customFetch<{
    success: boolean;
    entry: LibraryEntry;
    formatted_reference?: string;
    message?: string;
    errors?: Record<string, string[]>;
  }>({
    request,
    url: `/api/papers/${paperId}/library/${entryId}/update`,
    method: "post",
    data: JSON.stringify(patch),
  });

const removeLibraryEntry = async ({
  request,
  paperId,
  entryId,
}: {
  request: Request;
  paperId: string;
  entryId: string;
}) =>
  customFetch<{ success: boolean }>({
    request,
    url: `/api/papers/${paperId}/library/${entryId}`,
    method: "delete",
  });

const toggleLibraryEntryCite = async ({
  request,
  paperId,
  entryId,
  isCited,
}: {
  request: Request;
  paperId: string;
  entryId: number | string;
  isCited: boolean;
}) =>
  customFetch<{ success: boolean; entry: LibraryEntry; message?: string }>({
    request,
    url: `/api/papers/${paperId}/library/${entryId}/cite`,
    method: "post",
    data: JSON.stringify({ is_cited: isCited }),
  });

const attachLibraryEntry = async ({
  request,
  paperId,
  entryId,
  section,
  topic,
  statementText,
}: {
  request: Request;
  paperId: string;
  entryId: number | string;
  section: string;
  topic?: string;
  statementText?: string;
}) =>
  customFetch<{
    success: boolean;
    already_attached?: boolean;
    citation?: unknown;
    message?: string;
  }>({
    request,
    url: `/api/papers/${paperId}/library/${entryId}/attach`,
    method: "post",
    data: JSON.stringify({
      section,
      topic,
      statement_text: statementText,
    }),
  });

const researchSearch = async ({
  request,
  paperId,
  query,
}: {
  request: Request;
  paperId: string;
  query: string;
}) =>
  customFetch<ResearchSearchResponse>({
    request,
    url: `/api/papers/${paperId}/research-search`,
    method: "post",
    data: JSON.stringify({ query }),
  });

const getIntegrity = async ({
  request,
  paperId,
}: {
  request: Request;
  paperId: string;
}) =>
  customFetch<IntegrityResponse>({
    request,
    url: `/api/papers/${paperId}/integrity`,
    method: "get",
  });

const runIntegrityCheck = async ({
  request,
  paperId,
}: {
  request: Request;
  paperId: string;
}) =>
  customFetch<{ success: boolean; queued: string[]; skipped: string[] }>({
    request,
    url: `/api/papers/${paperId}/integrity-check`,
    method: "post",
  });

export {
  getLibraryEntries,
  getUserLibraryEntries,
  saveLibraryEntry,
  updateLibraryEntry,
  removeLibraryEntry,
  toggleLibraryEntryCite,
  attachLibraryEntry,
  researchSearch,
  getIntegrity,
  runIntegrityCheck,
};
