import { Button, Progress, Text } from "@mantine/core";
import { Link, useFetcher } from "@remix-run/react";
import { useMemo, useState } from "react";

import { Icon } from "#app/components/icon";
import { StatCard } from "./PaperScreen";
import { PageBreadcrumb, PageTitleBlock } from "./V2UIKit";
import classes from "./v2.module.css";

type PaperListItem = {
  id: string;
  title: string;
  overall_progress: number;
  created_at: string;
};

function DeleteProjectButton({ paperId }: { paperId: string }) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== "idle";

  return (
    <fetcher.Form
      method="post"
      action="/home/projects"
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Delete this project? Your saved library citations will be kept in the Library tab."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="intent" value="delete-paper" />
      <input type="hidden" name="paperId" value={paperId} />
      <button
        type="submit"
        disabled={isDeleting}
        className={classes.deletePaperBtn}
        aria-label="Delete project"
        title="Delete project"
      >
        <Icon name="pika-delete-paper" width={14} height={14} />
      </button>
    </fetcher.Form>
  );
}

export function HomeProjectsV2({
  papers,
  citationsSaved = 0,
}: {
  papers?: PaperListItem[];
  citationsSaved?: number;
}) {
  const [query, setQuery] = useState("");
  const list = papers ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((paper) => paper.title.toLowerCase().includes(q));
  }, [list, query]);

  const inProgress = list.filter((paper) => paper.overall_progress < 100).length;
  const completed = list.filter((paper) => paper.overall_progress >= 100).length;
  const avgCompletion =
    list.length > 0
      ? Math.round(
          list.reduce((sum, paper) => sum + paper.overall_progress, 0) / list.length
        )
      : 0;

  return (
    <div className={classes.dashboard}>
      <PageBreadcrumb>Home → Projects</PageBreadcrumb>

      <div className={`${classes.statsRow} ${classes.statsRowThree}`}>
        <StatCard label="Active projects" value={inProgress} accent />
        <StatCard label="Library citations" value={citationsSaved} />
        <StatCard
          label="Completion"
          value={`${avgCompletion}%`}
          sub={`${completed} ready to export`}
        />
      </div>

      <div className={classes.gridWrap}>
        <div className={classes.projectsToolbar}>
          <PageTitleBlock
            title="Your research projects"
            subtitle="Manage your research proposals"
          />
          <Button component={Link} to="/paper/new/purpose" size="xs">
            New project
          </Button>
          <input
            className={classes.searchInput}
            placeholder="Search projects..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            aria-label="Search projects"
          />
        </div>

        <div className={classes.projectGrid}>
          <Link
            to="/paper/new/purpose"
            className={`${classes.projectCard} ${classes.projectCardNew}`}
          >
            <Text size="sm" fw={600}>
              + New project
            </Text>
          </Link>

          {filtered.map((paper) => (
            <div key={paper.id} className={classes.projectCard}>
              <div className={classes.projectCardTop}>
                <Link
                  to={`/paper/${paper.id}`}
                  className={classes.continueTitle}
                  style={{ flex: 1, fontSize: 12, fontWeight: 600 }}
                >
                  <Text size="sm" fw={600} lineClamp={2}>
                    {paper.title}
                  </Text>
                </Link>
                <Link
                  to={`/paper/${paper.id}/settings`}
                  className={classes.settingsBtn}
                  aria-label="Project settings"
                >
                  <Icon name="settings-outline" width={14} height={14} />
                </Link>
                <DeleteProjectButton paperId={paper.id} />
              </div>
              <div className={classes.projectCardMeta}>
                <Text size="xs" c="dimmed">
                  {new Date(paper.created_at).toLocaleDateString()}
                </Text>
                <span className={classes.projectCardBadge}>
                  {paper.overall_progress}%
                </span>
              </div>
              <Progress
                size="xs"
                value={paper.overall_progress}
                color={
                  paper.overall_progress >= 100
                    ? "green"
                    : paper.overall_progress >= 50
                      ? "yellow"
                      : "red"
                }
              />
            </div>
          ))}
        </div>

        {filtered.length === 0 && query ? (
          <Text size="xs" c="dimmed">
            No projects match your search.
          </Text>
        ) : null}
      </div>
    </div>
  );
}
