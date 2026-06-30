import customFetch from "#app/utils/customFetch";

export interface MendeleyCitation {
  id: string;
  title: string;
  authors: { first_name?: string; last_name?: string }[];
  year: number;
  abstract?: string;
  source: string;
  identifiers?: {
    doi?: string;
  };
}

interface MendeleySearchResponse {
  success: boolean;
  citations: {
    citation: MendeleyCitation;
    highlighted: {
      title: string;
      abstract: string | null;
      authors: string | null;
    };
    highlight: string[];
  }[];
}

const searchMendeleyCitationsByQuery = async ({
  request,
  query,
}: {
  request: Request;
  query: string;
}) => {
  const res = await customFetch<MendeleySearchResponse>({
    request,
    url: `/api/mendeley/search-citations?query=${query}`,
    method: "get",
  });

  return res;
};

export { searchMendeleyCitationsByQuery };
