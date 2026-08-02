import { LoaderFunctionArgs } from "@remix-run/node";
import { invariant } from "@epic-web/invariant";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const pdfUrl = url.searchParams.get("url");
  const date = url.searchParams.get("date");
  invariant(pdfUrl, "PDF URL is required");
  invariant(date, "date is required");

  const filename = `proposal-${date}.pdf`;

  let response: Response;
  try {
    response = await fetch(pdfUrl);
  } catch {
    return new Response("Could not reach the document storage server.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!response.ok) {
    return new Response(
      `The PDF file could not be retrieved (${response.statusText}). Please regenerate the document and try again.`,
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const body = await response.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
};
