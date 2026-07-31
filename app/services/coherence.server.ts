import customFetch from "#app/utils/customFetch";

export type CoherenceWarning = {
  code: string;
  message: string;
  severity: "warn" | "info" | "error";
  suggested_design?: string;
  philosophy?: string;
  selected_design?: string;
};

export type CoherenceReportItem = {
  key: string;
  label: string;
  status: "ok" | "fail";
};

export type CoherenceResponse = {
  success: boolean;
  warnings: CoherenceWarning[];
  report: CoherenceReportItem[];
  aligned: boolean;
  suggested_design: string | null;
  philosophy: string | null;
  selected_design: string | null;
};

export const getCoherence = async ({
  request,
  paperId,
}: {
  request: Request;
  paperId: string;
}) =>
  customFetch<CoherenceResponse>({
    request,
    url: `/api/papers/${paperId}/coherence`,
    method: "get",
  });
