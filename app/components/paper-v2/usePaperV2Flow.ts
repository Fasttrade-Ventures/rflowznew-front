import type { loader as paperLayoutLoader } from "#app/routes/paper+/$paperId+/_layout";
import { useRouteLoaderData } from "@remix-run/react";

/** True when PAPER_V2_FLOW=true — simulation layout + pencil-aligned screens. */
export function usePaperV2Flow(): boolean {
  const data = useRouteLoaderData<typeof paperLayoutLoader>(
    "routes/paper+/$paperId+/_layout"
  );
  return data?.paperV2Flow ?? false;
}
