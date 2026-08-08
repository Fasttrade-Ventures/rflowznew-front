import type { loader as paperLayoutLoader } from "#app/routes/paper+/$paperId+/_layout";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguageCode,
  type LanguageCode,
} from "#app/utils/languages";
import { useRouteLoaderData } from "@remix-run/react";

export function usePaperLanguage(): LanguageCode {
  const data = useRouteLoaderData<typeof paperLayoutLoader>(
    "routes/paper+/$paperId+/_layout"
  );
  return normalizeLanguageCode(data?.paper?.language ?? DEFAULT_LANGUAGE);
}
