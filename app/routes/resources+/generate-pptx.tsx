import { LoaderFunctionArgs } from "@remix-run/node";
import { invariant } from "@epic-web/invariant";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const pptxUrl = url.searchParams.get("url");
  const date = url.searchParams.get("date");
  invariant(pptxUrl, "PPTX URL is required");
  invariant(date, "date is required");

  const filename = `proposal-${date}.pptx`;

  let response: Response;
  try {
    response = await fetch(pptxUrl);
  } catch {
    return new Response("Could not reach the document storage server.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!response.ok) {
    return new Response(
      `The PPTX file could not be retrieved (${response.statusText}). Please regenerate the document and try again.`,
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const body = await response.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
};
