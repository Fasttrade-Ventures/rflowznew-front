import type { LibraryEntry } from "#app/services/library.server";
import type { UserSubscription } from "#app/services/subscription.server";
import { getAskProfZPlanDisplay } from "#app/utils/ask-prof-z-plan-label";

type PaperSummary = {
  id: string;
  title: string;
  overall_progress: number;
  created_at: string;
};

export type DashboardActivity = {
  id: string;
  label: string;
  occurredAt: string;
  href?: string;
};

export type DashboardStats = {
  activeProjects: number;
  totalProjects: number;
  projectsThisMonth: number;
  citationsSaved: number;
  citationsThisWeek: number;
  avgCompletion: number;
  completedProjects: number;
  aiRemaining: string;
  aiSub: string;
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysAgo(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function currentStepLabel(progress: number): string {
  if (progress >= 100) return "Review Proposal · Complete";
  if (progress >= 86) return "Review Proposal · Step 7/7";
  if (progress >= 72) return "Frameworks · Step 6/7";
  if (progress >= 58) return "Methodology · Step 5/7";
  if (progress >= 43) return "Philosophy · Step 4/7";
  if (progress >= 29) return "Research Questions · Step 3/7";
  if (progress >= 15) return "Problem Statement · Step 2/7";
  return "Source Library · Step 1/7";
}

export function computeDashboardStats({
  papers,
  libraryEntries,
  subscription,
  features,
}: {
  papers: PaperSummary[];
  libraryEntries: LibraryEntry[];
  subscription: UserSubscription | null | undefined;
  features?: {
    plan_key?: string;
    unlimited_ai?: boolean;
    ai_limit_remaining?: number;
    ai_original_monthly_limit?: number;
  } | null;
}): DashboardStats {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekStart = daysAgo(now, 7);

  const totalProjects = papers.length;
  const activeProjects = papers.filter((paper) => paper.overall_progress < 100).length;
  const completedProjects = papers.filter((paper) => paper.overall_progress >= 100).length;
  const projectsThisMonth = papers.filter(
    (paper) => new Date(paper.created_at) >= monthStart
  ).length;
  const citationsSaved = libraryEntries.length;
  const citationsThisWeek = libraryEntries.filter(
    (entry) => new Date(entry.created_at) >= weekStart
  ).length;
  const avgCompletion =
    totalProjects > 0
      ? Math.round(
          papers.reduce((sum, paper) => sum + paper.overall_progress, 0) /
            totalProjects
        )
      : 0;

  const planKey =
    features?.plan_key ?? subscription?.plan_key ?? (subscription ? undefined : "free");
  const askProfZ = getAskProfZPlanDisplay(planKey);

  return {
    activeProjects,
    totalProjects,
    projectsThisMonth,
    citationsSaved,
    citationsThisWeek,
    avgCompletion,
    completedProjects,
    aiRemaining: askProfZ.value,
    aiSub: askProfZ.sub,
  };
}

export function buildDashboardActivity(
  papers: PaperSummary[],
  libraryEntries: LibraryEntry[]
): DashboardActivity[] {
  const paperItems: DashboardActivity[] = papers.map((paper) => ({
    id: `paper-${paper.id}`,
    label: `Created project “${truncate(paper.title, 56)}”`,
    occurredAt: paper.created_at,
    href: `/paper/${paper.id}`,
  }));

  const libraryItems: DashboardActivity[] = libraryEntries.map((entry) => ({
    id: `library-${entry.id}`,
    label:
      entry.kind === "web"
        ? `Saved source “${truncate(entry.title, 56)}”`
        : `Saved citation “${truncate(entry.title, 56)}”`,
    occurredAt: entry.created_at,
    href: `/paper/${entry.paper_id}/library`,
  }));

  return [...paperItems, ...libraryItems]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, 6);
}

export function formatActivityWhen(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}
