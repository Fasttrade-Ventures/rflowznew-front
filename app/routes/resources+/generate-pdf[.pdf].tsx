import { LoaderFunctionArgs } from "@remix-run/node";
import { invariant } from "@epic-web/invariant";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pdfUrl = url.searchParams.get("url");
  const date = url.searchParams.get("date");
  invariant(pdfUrl, "PDF URL is required");

  const response = await fetch(pdfUrl);
  invariant(response.ok, `Failed to fetch PDF: ${response.statusText}`);

  return new Response(response.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rflowz-document-${date}.pdf"`,
    },
  });
}
