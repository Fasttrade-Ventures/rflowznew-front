import { z } from "zod";

export const WIZARD_STEPS = [
  "1. Purpose",
  "2. Topic",
  "3. Review",
] as const;

export const topicSchema = z.object({
  purpose: z.string().min(1),
  rqCount: z.coerce.number().min(1).max(5),
  topic: z.string().min(3, "Enter your research topic"),
  who: z.string().min(2, "Who is your population?"),
  what: z.string().min(2, "What matters in this study?"),
  where: z.string().min(2, "Where is the study situated?"),
});

export type TopicDraft = z.infer<typeof topicSchema>;

export type NewProjectDraft = TopicDraft & {
  refinedStatement: string;
};

export type SimulationEngineRoute = "TreZ" | "TAM" | "artifact";

const STORAGE_KEY = "rflowz-new-project-draft";

export function buildRefinedStatement(draft: TopicDraft): string {
  const topic = draft.topic.trim();
  if (draft.who && draft.what && draft.where) {
    return `An interpretive study of how ${draft.who} experience ${draft.what} in ${draft.where}.`;
  }
  return topic;
}

export function purposeLabel(purpose: string): string {
  switch (purpose) {
    case "paper":
      return "Research paper";
    case "masters":
      return "Master's / PhD";
    case "phd":
      return "PhD dissertation";
    case "grant":
      return "Research grant";
    case "project":
      return "Research project";
    case "coursework":
      return "Coursework project";
    default:
      return purpose;
  }
}

export function engineRouteLabel(
  purpose: string,
  rqCount: number
): string {
  const engines = engineRouteForPurpose(purpose, rqCount);
  return engines.join(" + ");
}

export function engineRouteForPurpose(
  purpose: string,
  rqCount: number
): SimulationEngineRoute[] {
  if (purpose === "paper" || purpose === "project" || rqCount <= 1) {
    return ["TreZ"];
  }
  if (rqCount === 2) {
    return ["TreZ", "TAM"];
  }
  return ["TreZ", "TAM", "artifact"];
}

export function buildKeywordsFromDraft(draft: NewProjectDraft): string[] {
  const fromFields = [
    ...draft.what.split(/[,\s]+/),
    ...draft.where.split(/[,\s]+/),
    ...draft.topic.split(/[,\s]+/),
  ]
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  const unique = [...new Set(fromFields)];
  if (unique.length > 0) return unique.slice(0, 5);
  return [draft.topic.trim()];
}

export function splitUserName(name: string): {
  first_name: string;
  last_name: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: "Researcher", last_name: "User" };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "User" };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export function buildPaperPayloadFromDraft(
  draft: NewProjectDraft,
  userName: string
) {
  const author = splitUserName(userName);

  return {
    title: draft.refinedStatement.slice(0, 255),
    context: draft.where,
    method: "Qualitative" as const,
    tangibleOutput: { type: "Framework" as const },
    language: "en" as const,
    authors: [author],
    keywords: buildKeywordsFromDraft(draft),
    affiliations: [] as [],
    meta: {
      simulation_v2: true,
      purpose: draft.purpose,
      rqCount: draft.rqCount,
      engineRoute: engineRouteForPurpose(draft.purpose, draft.rqCount),
      topic: draft.topic,
      who: draft.who,
      what: draft.what,
      where: draft.where,
      refinedStatement: draft.refinedStatement,
    },
  };
}

export function readWizardDraft(): NewProjectDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NewProjectDraft;
  } catch {
    return null;
  }
}

export function writeWizardDraft(draft: NewProjectDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearWizardDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
