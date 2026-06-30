import { LoaderFunctionArgs } from "@remix-run/node";
import { invariant } from "@epic-web/invariant";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const docxUrl = url.searchParams.get("url");
  const date = url.searchParams.get("date");
  invariant(docxUrl, "DOCX URL is required");

  const response = await fetch(docxUrl);
  invariant(response.ok, `Failed to fetch DOCX: ${response.statusText}`);

  return new Response(response.body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="rflowz-document-${date}.docx"`,
    },
  });
}
