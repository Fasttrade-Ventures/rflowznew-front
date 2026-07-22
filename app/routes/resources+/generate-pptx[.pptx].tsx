import { LoaderFunctionArgs } from "@remix-run/node";
import { invariant } from "@epic-web/invariant";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pptxUrl = url.searchParams.get("url");
  const date = url.searchParams.get("date");
  invariant(pptxUrl, "PPTX URL is required");

  const response = await fetch(pptxUrl);
  invariant(response.ok, `Failed to fetch PPTX: ${response.statusText}`);

  return new Response(response.body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="rflowz-document-${date}.pptx"`,
    },
  });
}
