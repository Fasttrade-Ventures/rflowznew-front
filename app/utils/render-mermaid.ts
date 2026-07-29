import { prepareMermaidRepairAttempts } from "#app/utils/sanitize-mermaid-source";

export type MermaidRenderResult = {
  svg: string;
  repairedSource: string;
};

let mermaidModule: typeof import("mermaid") | null = null;

async function getMermaid() {
  if (typeof window === "undefined") {
    throw new Error("Mermaid can only render in the browser");
  }

  if (!mermaidModule) {
    mermaidModule = await import("mermaid");
    mermaidModule.default.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      suppressErrorRendering: true,
    });
  }
  return mermaidModule.default;
}

function formatMermaidError(error: unknown): string {
  if (!(error instanceof Error)) return "Could not render diagram";
  const message = error.message.trim();
  if (!message || message === "Syntax error in text") {
    return "Mermaid syntax error — click Preview again after editing, or re-ask Prof Z.";
  }
  return message;
}

/** Try repair levels (gentle → aggressive) until Mermaid can render. */
export async function repairAndRenderMermaid(
  source: string
): Promise<MermaidRenderResult> {
  const mermaid = await getMermaid();
  const attempts = prepareMermaidRepairAttempts(source);
  let lastError: unknown = new Error("Could not render diagram");

  for (const attempt of attempts) {
    if (!attempt.trim()) continue;
    try {
      const id = `mmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { svg } = await mermaid.render(id, attempt);
      return { svg, repairedSource: attempt };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(formatMermaidError(lastError));
}

/** @deprecated Use repairAndRenderMermaid */
export async function renderMermaidSvg(source: string): Promise<MermaidRenderResult> {
  return repairAndRenderMermaid(source);
}
