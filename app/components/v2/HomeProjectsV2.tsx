import { Button, Progress, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Link, useFetcher, useRevalidator } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";

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

type ViewMode = "list" | "grid";

function DeleteProjectButton({ paperId }: { paperId: string }) {
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const revalidator = useRevalidator();
  const fetcherHandledRef = useRef(false);
  const isDeleting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state === "submitting") {
      fetcherHandledRef.current = false;
    }
  }, [fetcher.state]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || fetcherHandledRef.current) {
      return;
    }
    fetcherHandledRef.current = true;

    if (fetcher.data.ok) {
      notifications.show({
        title: "Project deleted",
        message: "Your library citations were kept in the Library tab.",
        color: "teal",
      });
      revalidator.revalidate();
      return;
    }

    notifications.show({
      title: "Could not delete project",
      message:
        fetcher.data.error ??
        "Something went wrong. Run API migrations and try again.",
      color: "red",
    });
  }, [fetcher.data, fetcher.state, revalidator.revalidate]);

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
        title={isDeleting ? "Deleting…" : "Delete project"}
      >
        <Icon name="pika-delete-paper" width={14} height={14} />
      </button>
    </fetcher.Form>
  );
}

function progressColor(pct: number) {
  if (pct >= 100) return "var(--mantine-color-green-6)";
  if (pct >= 50) return "var(--mantine-color-yellow-6)";
  return "var(--mantine-color-red-5)";
}

export function HomeProjectsV2({
  papers,
  citationsSaved = 0,
}: {
  papers?: PaperListItem[];
  citationsSaved?: number;
}) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
          <div className={classes.viewToggle}>
            <button
              type="button"
              title="List view"
              aria-label="List view"
              className={`${classes.viewToggleBtn} ${viewMode === "list" ? classes.viewToggleBtnActive : ""}`}
              onClick={() => setViewMode("list")}
            >
              {/* List icon */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              title="Grid view"
              aria-label="Grid view"
              className={`${classes.viewToggleBtn} ${viewMode === "grid" ? classes.viewToggleBtnActive : ""}`}
              onClick={() => setViewMode("grid")}
            >
              {/* Grid icon */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
          <Button component={Link} to="/paper/new/chat" size="xs">
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

        {viewMode === "grid" ? (
          <div className={classes.projectGrid}>
            <Link
              to="/paper/new/chat"
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
        ) : (
          <div className={classes.projectList}>
            <Link to="/paper/new/chat" className={classes.projectListNewRow}>
              + New project
            </Link>
            {filtered.map((paper) => (
              <div key={paper.id} className={classes.projectListRow}>
                <Link
                  to={`/paper/${paper.id}`}
                  className={classes.projectListTitle}
                >
                  {paper.title}
                </Link>
                <div className={classes.projectListMeta}>
                  <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                  <div className={classes.projectListProgress}>
                    <div className={classes.projectListProgressBar}>
                      <div
                        className={classes.projectListProgressFill}
                        style={{
                          width: `${paper.overall_progress}%`,
                          background: progressColor(paper.overall_progress),
                        }}
                      />
                    </div>
                    <span style={{ minWidth: 30, textAlign: "right" }}>
                      {paper.overall_progress}%
                    </span>
                  </div>
                  <Link
                    to={`/paper/${paper.id}/settings`}
                    className={classes.settingsBtn}
                    aria-label="Project settings"
                  >
                    <Icon name="settings-outline" width={14} height={14} />
                  </Link>
                  <DeleteProjectButton paperId={paper.id} />
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && query ? (
          <Text size="xs" c="dimmed">
            No projects match your search.
          </Text>
        ) : null}
      </div>
    </div>
  );
}
