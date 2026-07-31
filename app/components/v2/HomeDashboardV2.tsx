import { Button, Progress, Text } from "@mantine/core";
import { Link } from "@remix-run/react";

import { Icon } from "#app/components/icon";
import { StatCard } from "./PaperScreen";
import { PageBreadcrumb } from "./V2UIKit";
import classes from "./v2.module.css";

type PaperListItem = {
  id: string;
  title: string;
  overall_progress: number;
  created_at: string;
};

type DashboardStats = {
  activeProjects: number;
  citationsSaved: number;
  avgCompletion: number;
};

const RECENT_ACTIVITY = [
  "Added citations to a project",
  "Generated problem statement",
  "Updated methodology section",
  "Exported DOCX proposal",
] as const;

function stepLabel(progress: number): string {
  if (progress >= 100) return "Review Proposal · Complete";
  if (progress >= 75) return "Frameworks · Step 8/9";
  if (progress >= 60) return "Methodology · Step 7/9";
  if (progress >= 45) return "Philosophy · Step 6/9";
  if (progress >= 30) return "Research Questions · Step 5/9";
  if (progress >= 15) return "Problem Statement · Step 4/9";
  return "Source Library · Step 3/9";
}

export function HomeDashboardV2({
  papers,
  stats,
  userName,
  isPro,
}: {
  papers?: PaperListItem[];
  stats: DashboardStats;
  userName?: string;
  isPro?: boolean;
}) {
  const list = papers ?? [];
  const firstName = userName?.split(" ")[0] ?? "there";
  const inProgress = list
    .filter((p) => p.overall_progress < 100)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 3);

  return (
    <div className={classes.dashboard}>
      <PageBreadcrumb>Home → Dashboard</PageBreadcrumb>
      <div className={classes.hero}>
        <div>
          <div className={classes.heroTitle}>Welcome back, {firstName}</div>
          <div className={classes.heroSub}>
            Pick up where you left off or start a new research project.
          </div>
        </div>
        <div className={classes.heroActions}>
          <Button
            component={Link}
            to="/home/library"
            variant="outline"
            size="xs"
          >
            Browse library
          </Button>
          <Button component={Link} to="/paper/new/purpose" size="xs">
            + New project
          </Button>
        </div>
      </div>

      <div className={classes.statsRow}>
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          sub="+1 this month"
          accent
        />
        <StatCard
          label="Citations saved"
          value={stats.citationsSaved}
          sub="+12 this week"
          accent
        />
        <StatCard
          label="Avg completion"
          value={`${stats.avgCompletion}%`}
          sub="Across projects"
          accent
        />
        <StatCard
          label="AI generations"
          value={isPro ? "36" : "—"}
          sub={isPro ? "Pro plan" : "Upgrade to Pro"}
          accent
        />
      </div>

      <div className={classes.dashboardGrid}>
        <div className={classes.dashboardPanel}>
          <div className={classes.panelHeading}>Continue working</div>
          {inProgress.length === 0 ? (
            <Text size="xs" c="dimmed">
              No active projects yet. Create one to get started.
            </Text>
          ) : (
            <div className={classes.continueList}>
              {inProgress.map((paper) => (
                <div key={paper.id} className={classes.continueRow}>
                  <div className={classes.continueTop}>
                    <Link
                      to={`/paper/${paper.id}`}
                      className={classes.continueTitle}
                    >
                      {paper.title}
                    </Link>
                    <div className={classes.continueMeta}>
                      <span className={classes.continuePct}>
                        {paper.overall_progress}%
                      </span>
                      <Link
                        to={`/paper/${paper.id}/settings`}
                        className={classes.settingsBtn}
                        aria-label="Project settings"
                      >
                        <Icon name="settings-outline" width={12} height={12} />
                      </Link>
                    </div>
                  </div>
                  <Text size="xs" c="dimmed">
                    {stepLabel(paper.overall_progress)}
                  </Text>
                  <Progress
                    size="xs"
                    value={paper.overall_progress}
                    color="blue"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={classes.dashboardSide}>
          <div className={classes.dashboardPanel}>
            <div className={classes.panelHeading}>Quick actions</div>
            <div className={classes.quickActions}>
              <Button
                component={Link}
                to="/paper/new/purpose"
                variant="outline"
                size="xs"
                fullWidth
              >
                Create project
              </Button>
              <Button
                component={Link}
                to="/home/library"
                variant="outline"
                size="xs"
                fullWidth
              >
                Search library
              </Button>
              <Button
                component={Link}
                to={inProgress[0] ? `/paper/${inProgress[0].id}/settings` : "/home/projects"}
                variant="outline"
                size="xs"
                fullWidth
              >
                Edit project settings
              </Button>
              <Button
                component={Link}
                to={inProgress[0] ? `/paper/${inProgress[0].id}/review-proposal` : "/home/projects"}
                variant="outline"
                size="xs"
                fullWidth
              >
                Export proposal
              </Button>
            </div>
          </div>

          <div className={`${classes.dashboardPanel} ${classes.activityPanel}`}>
            <div className={classes.panelHeading}>Recent activity</div>
            <ul className={classes.activityList}>
              {RECENT_ACTIVITY.map((item) => (
                <li key={item} className={classes.activityItem}>
                  <span className={classes.activityDot} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
