import { PAPER_NAV_PHASES } from "#app/components/paper-v2/nav-config";

export type PaperProgressMap = Record<
  string,
  { completion_percentage: number }
>;

const V2_OVERALL_KEYS = [
  "library",
  "problem_statement",
  "research_question_and_objective",
  "philosophy",
  "methodology",
  "framework",
  "review_proposal",
] as const;

export function computeV2OverallProgress(progress: PaperProgressMap): number {
  const values = V2_OVERALL_KEYS.map(
    (key) => progress[key]?.completion_percentage ?? 0
  );

  if (values.length === 0) return 0;

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function computeLegacyOverallProgress(progress: PaperProgressMap): number {
  const values = Object.values(progress).map((p) => p.completion_percentage);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function computePaperOverallProgress(
  progress: PaperProgressMap,
  options?: { simulationV2?: boolean; overallPercentage?: number | null }
): number {
  if (typeof options?.overallPercentage === "number") {
    return Math.round(options.overallPercentage);
  }

  if (options?.simulationV2) {
    return computeV2OverallProgress(progress);
  }

  return computeLegacyOverallProgress(progress);
}

export function navProgressKeys(): string[] {
  return PAPER_NAV_PHASES.flatMap((group) =>
    group.items
      .map((item) => item.progressKey)
      .filter((key): key is string => Boolean(key))
  );
}
