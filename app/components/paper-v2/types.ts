import type { IconName } from "#app/icons/types";

export type PaperNavPhase = "SETUP" | "DESIGN" | "OUTPUT";

export type PaperNavItem = {
  label: string;
  path: string;
  icon: IconName;
  /** Maps to PaperProgressController keys when available */
  progressKey?: string;
  /** Shown in nav before the screen is implemented */
  comingSoon?: boolean;
};

export type PaperNavPhaseGroup = {
  phase: PaperNavPhase;
  items: PaperNavItem[];
};

export type ReviewProposalTab =
  | "preview"
  | "apa_references"
  | "integrity"
  | "diagrams";

export type PaperWorkspaceLayoutProps = {
  paperId: string;
  paperTitle: string;
  paperMethod: "Qualitative" | "Quantitative" | "Mixed";
  progress: Record<string, { completion_percentage: number }>;
  overallPercentage?: number;
  simulationV2?: boolean;
  userName?: string;
  userEmail?: string;
};
