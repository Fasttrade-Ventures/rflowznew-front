import customFetch from "#app/utils/customFetch";

export interface FormattingPreferences {
  font_family: string;
  font_size: number;
  line_spacing: number;
  margin_preset: "normal" | "narrow" | "wide" | "custom";
  margin_top: number | null;
  margin_right: number | null;
  margin_bottom: number | null;
  margin_left: number | null;
  header_enabled: boolean;
  header_text: string | null;
  footer_enabled: boolean;
  footer_text: string | null;
  page_number_enabled: boolean;
  page_number_position: "footer_center" | "footer_right" | "header_right";
  citation_style: "apa" | "mla" | "chicago" | "harvard" | "ieee";
}

interface FormattingResponse {
  message?: string;
  preferences: FormattingPreferences;
  is_customized: boolean;
}

export const getFormattingPreferences = async ({
  request,
}: {
  request: Request;
}) => {
  return customFetch<FormattingResponse>({
    request,
    url: "/api/formatting-preferences",
    method: "get",
  });
};

export const saveFormattingPreferences = async ({
  request,
  preferences,
}: {
  request: Request;
  preferences: FormattingPreferences;
}) => {
  return customFetch<FormattingResponse>({
    request,
    url: "/api/formatting-preferences",
    method: "put",
    data: JSON.stringify(preferences),
  });
};

export const resetFormattingPreferences = async ({
  request,
}: {
  request: Request;
}) => {
  return customFetch<FormattingResponse>({
    request,
    url: "/api/formatting-preferences",
    method: "delete",
  });
};
