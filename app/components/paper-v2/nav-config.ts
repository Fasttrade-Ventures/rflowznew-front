import type { PaperNavPhaseGroup } from "./types";

/**
 * Simulation flow navigation (Option A).
 * Background / Literature Review are assembled at Review Proposal — not listed here.
 */
export const PAPER_NAV_PHASES: PaperNavPhaseGroup[] = [
  {
    phase: "SETUP",
    items: [
      {
        label: "Library",
        path: "library",
        icon: "pika-file-bolt",
        progressKey: "library",
      },
      {
        label: "Problem Statement",
        path: "problem-statement",
        icon: "number-2-small-outline",
        progressKey: "problem_statement",
      },
      {
        label: "Research Questions",
        path: "research-questions-and-objectives",
        icon: "number-4-small-outline",
        progressKey: "research_question_and_objective",
      },
    ],
  },
  {
    phase: "DESIGN",
    items: [
      {
        label: "Philosophy",
        path: "philosophy",
        icon: "pika-user-question-mark",
        progressKey: "philosophy",
      },
      {
        label: "Methodology",
        path: "methodology",
        icon: "number-6-small-outline",
        progressKey: "methodology",
      },
      {
        label: "Frameworks",
        path: "frameworks",
        icon: "pika-spatial",
        progressKey: "framework",
      },
    ],
  },
  {
    phase: "OUTPUT",
    items: [
      {
        label: "Review Proposal",
        path: "review-proposal",
        icon: "pika-file",
        progressKey: "review_proposal",
      },
    ],
  },
];

export function buildPaperNavHref(paperId: string, path: string): string {
  return `/paper/${paperId}/${path}`;
}
