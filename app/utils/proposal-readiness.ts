import type { ProposalSections } from "#app/services/proposal-assembly.server";

const READINESS_KEYS = [
  "introduction",
  "lit_review",
  "methodology",
  "expected_results",
  "conclusion",
  "benefits",
  "references",
  "diagram",
] as const;

export function computeProposalReadiness(sections: ProposalSections) {
  const ready = READINESS_KEYS.filter((key) =>
    Boolean(sections[key]?.content?.trim())
  );

  const percent = Math.round((ready.length / READINESS_KEYS.length) * 100);

  return {
    readyCount: ready.length,
    totalCount: READINESS_KEYS.length,
    percent,
    setupReady: Boolean(sections.introduction?.content?.trim()),
    writingReady:
      Boolean(sections.lit_review?.content?.trim()) &&
      Boolean(sections.conclusion?.content?.trim()),
    methodReady: Boolean(sections.methodology?.content?.trim()),
    referencesReady: Boolean(sections.references?.content?.trim()),
  };
}
