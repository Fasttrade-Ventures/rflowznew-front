import customFetch from "#app/utils/customFetch";
import { OpenAlexCite } from "#app/services/openalex.server";

export interface LibraryEntry {
  id: number;
  paper_id: string;
  kind: "academic" | "web";
  title: string;
  source: string | null;
  url: string | null;
  year: number | null;
  openalex_id: string | null;
  cite: OpenAlexCite | null;
  summary: string | null;
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

const saveLibraryEntry = async ({
  request,
  paperId,
  entry,
}: {
  request: Request;
  paperId: string;
  entry: Partial<LibraryEntry>;
}) =>
  customFetch<LibraryStoreResponse>({
    request,
    url: `/api/papers/${paperId}/library`,
    method: "post",
    data: JSON.stringify(entry),
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
  saveLibraryEntry,
  removeLibraryEntry,
  researchSearch,
  getIntegrity,
  runIntegrityCheck,
};
