import customFetch from "#app/utils/customFetch";

export type ProposalSection = {
  content: string;
  source: "stitched" | "ai" | "edited";
  editable: boolean;
  image_url?: string | null;
};

export type ProposalSections = Record<string, ProposalSection>;

export const getProposalAssembly = async ({
  request,
  paperId,
}: {
  request: Request;
  paperId: string;
}) =>
  customFetch<{ success: boolean; sections: ProposalSections }>({
    request,
    url: `/api/papers/${paperId}/proposal-assembly`,
    method: "get",
  });

export const saveProposalSection = async ({
  request,
  paperId,
  sectionKey,
  content,
  source = "edited",
}: {
  request: Request;
  paperId: string;
  sectionKey: string;
  content: string;
  source?: string;
}) =>
  customFetch({
    request,
    url: `/api/papers/${paperId}/proposal-assembly`,
    method: "put",
    data: JSON.stringify({ section_key: sectionKey, content, source }),
  });
