import { getSession } from "#app/services/session.server";
import { getApiHost } from "#app/utils/env.server";
import { invariant } from "@epic-web/invariant";
import { LoaderFunctionArgs } from "@remix-run/node";

/**
 * Streams the paper library's reference-manager export (BibTeX/RIS/XML)
 * from the API. A resource route is needed because the API requires the
 * bearer token, which lives in the server-side session.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const paperId = url.searchParams.get("paperId");
  const format = url.searchParams.get("format");

  invariant(paperId, "paperId is required");
  invariant(
    format === "bibtex" || format === "ris" || format === "xml",
    "format must be bibtex, ris, or xml"
  );

  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user") as { token?: string } | undefined;

  const response = await fetch(
    `${getApiHost()}/api/papers/${paperId}/library/export?format=${format}`,
    {
      headers: new Headers({
        ...(user?.token && { Authorization: "Bearer " + user.token }),
        Accept: "application/json",
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    return new Response(detail || "Export failed", { status: response.status });
  }

  const extension = format === "bibtex" ? "bib" : format;

  return new Response(await response.text(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename=references.${extension}`,
    },
  });
};
