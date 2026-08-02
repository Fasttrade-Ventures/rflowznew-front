import { LoaderFunctionArgs } from "@remix-run/node";
import { invariant } from "@epic-web/invariant";
import { Link } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pptxUrl = url.searchParams.get("url");
  const date = url.searchParams.get("date");
  invariant(pptxUrl, "PPTX URL is required");

  let response: Response;
  try {
    response = await fetch(pptxUrl);
  } catch {
    throw new Response("Could not reach the document storage server.", {
      status: 502,
    });
  }

  if (!response.ok) {
    throw new Response(
      `The PPTX file could not be retrieved (${response.statusText}). Please regenerate the document and try again.`,
      { status: 404 }
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="rflowz-document-${date}.pptx"`,
    },
  });
}

export function ErrorBoundary() {
  return (
    <div style={{ padding: "2rem", maxWidth: 480, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Document unavailable</h2>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        The PPTX file could not be downloaded — the file may have expired or
        not yet finished generating. Please go back and regenerate the document.
      </p>
      <Link to="/" style={{ color: "#228be6" }}>← Back to home</Link>
    </div>
  );
}
