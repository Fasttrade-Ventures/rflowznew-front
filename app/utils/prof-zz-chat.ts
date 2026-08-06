export type ResearchPurpose = "short" | "masters" | "phd" | "paper";

export type ChatWizardSource = {
  title: string;
  url?: string | null;
  summary?: string | null;
  author?: string | null;
  published_date?: string | null;
};

export type ChatUiMode = "choices" | "text" | "status" | "confirm" | "done";

export type ChatMessage = {
  id: string;
  role: "prof" | "user" | "status";
  text: string;
};

export const RESEARCH_TYPE_OPTIONS: Array<{
  id: ResearchPurpose;
  label: string;
  rqCount: number;
}> = [
  { id: "short", label: "Short research", rqCount: 1 },
  { id: "masters", label: "Master's", rqCount: 2 },
  { id: "phd", label: "PhD", rqCount: 3 },
  { id: "paper", label: "Paper writing", rqCount: 1 },
];

export function purposeLabel(purpose: ResearchPurpose): string {
  switch (purpose) {
    case "short":
      return "Short research";
    case "masters":
      return "Master's";
    case "phd":
      return "PhD";
    case "paper":
      return "Paper writing";
  }
}

export function buildRefinedStatement(topic: string, focus: string): string {
  const t = topic.trim();
  const f = focus.trim();
  if (!f) return t.slice(0, 512);
  // Prefer a concise interpretive framing when focus is social/lived experience.
  if (/social|experience|resident|community|lived/i.test(f)) {
    return `An interpretive study of how participants experience ${t} — ${f}.`.slice(
      0,
      512
    );
  }
  return `${t}: ${f}`.slice(0, 512);
}

export function buildClarifyQuestion(
  sources: ChatWizardSource[],
  topic: string
): string {
  const titles = sources
    .slice(0, 2)
    .map((s) => s.title)
    .filter(Boolean);
  if (titles.length >= 2) {
    return `I found “${titles[0]}” and “${titles[1]}”. Is your concern the social / lived-experience side of this topic — or the physical / technical design side?`;
  }
  if (titles.length === 1) {
    return `I found “${titles[0]}” related to ${topic}. Is your concern the social / lived-experience side — or the physical / technical design side?`;
  }
  return `I could not retrieve strong background sources just now. Still, for “${topic}”, is your concern the social / lived-experience side — or the physical / technical design side?`;
}

export function buildConfirmLine(topic: string, focus: string): string {
  const refined = buildRefinedStatement(topic, focus);
  return `So: ${refined} Shall we lock this in?`;
}
