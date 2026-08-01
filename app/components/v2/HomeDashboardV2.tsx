import { Button, Progress, Text } from "@mantine/core";
import { Link } from "@remix-run/react";

import { Icon } from "#app/components/icon";
import {
  currentStepLabel,
  formatActivityWhen,
  type DashboardActivity,
  type DashboardStats,
} from "#app/utils/home-dashboard";
import { displayFirstName } from "#app/utils/plan";
import { StatCard } from "./PaperScreen";
import { PageBreadcrumb } from "./V2UIKit";
import classes from "./v2.module.css";

type PaperListItem = {
  id: string;
  title: string;
  overall_progress: number;
  created_at: string;
};

export function HomeDashboardV2({
  papers,
  stats,
  activity,
  userName,
  userEmail,
}: {
  papers?: PaperListItem[];
  stats: DashboardStats;
  activity: DashboardActivity[];
  userName?: string;
  userEmail?: string;
}) {
  const list = papers ?? [];
  const firstName = displayFirstName(userName, userEmail);
  const inProgress = list
    .filter((paper) => paper.overall_progress < 100)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 3);

  const projectsSub =
    stats.projectsThisMonth > 0
      ? `${stats.projectsThisMonth} created this month`
      : stats.totalProjects > 0
        ? `${stats.totalProjects} total`
        : "Start your first project";

  const citationsSub =
    stats.citationsThisWeek > 0
      ? `${stats.citationsThisWeek} added this week`
      : stats.citationsSaved > 0
        ? "Across all projects"
        : "Save sources from your library";

  const completionSub =
    stats.totalProjects > 0
      ? `${stats.completedProjects} completed`
      : "No projects yet";

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
          sub={projectsSub}
          accent
        />
        <StatCard
          label="Citations saved"
          value={stats.citationsSaved}
          sub={citationsSub}
          accent
        />
        <StatCard
          label="Avg completion"
          value={`${stats.avgCompletion}%`}
          sub={completionSub}
          accent
        />
        <StatCard
          label="AI generations"
          value={stats.aiRemaining}
          sub={stats.aiSub}
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
                    {currentStepLabel(paper.overall_progress)}
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
            {activity.length === 0 ? (
              <Text size="xs" c="dimmed">
                Activity from your projects and library will appear here.
              </Text>
            ) : (
              <ul className={classes.activityList}>
                {activity.map((item) => (
                  <li key={item.id} className={classes.activityItem}>
                    <span className={classes.activityDot} />
                    <span className={classes.activityContent}>
                      {item.href ? (
                        <Link to={item.href} className={classes.activityLink}>
                          {item.label}
                        </Link>
                      ) : (
                        item.label
                      )}
                      <span className={classes.activityWhen}>
                        {formatActivityWhen(item.occurredAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
