import { loader as rootLoader } from "#app/root";
import { useRouteLoaderData } from "@remix-run/react";

export function usePaperV2Flow(): boolean {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  return Boolean(rootData?.paperV2Flow);
}
