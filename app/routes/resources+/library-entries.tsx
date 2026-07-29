import { getLibraryEntries } from "#app/services/library.server";
import { invariant } from "@epic-web/invariant";
import { json, LoaderFunctionArgs } from "@remix-run/node";

/**
 * JSON resource for the Add Citation "From Library" tab.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const paperId = url.searchParams.get("paperId");
  invariant(paperId, "paperId is required");

  const res = await getLibraryEntries({ request, paperId });

  return json({
    success: res.data?.success ?? false,
    entries: res.data?.entries ?? [],
  });
};
