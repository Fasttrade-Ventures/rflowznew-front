import { Button, Group, Progress, Text } from "@mantine/core";
import { Link } from "@remix-run/react";
import { useMemo, useState } from "react";

import { Icon } from "#app/components/icon";
import { StatCard } from "./PaperScreen";
import { PageBreadcrumb, PageTitleBlock, ToolbarRow } from "./V2UIKit";
import classes from "./v2.module.css";

type PaperListItem = {
  id: string;
  title: string;
  overall_progress: number;
  created_at: string;
};

export function HomeProjectsV2({ papers }: { papers?: PaperListItem[] }) {
  const [query, setQuery] = useState("");
  const list = papers ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.title.toLowerCase().includes(q));
  }, [list, query]);

  const inProgress = list.filter((p) => p.overall_progress < 100).length;
  const completed = list.filter((p) => p.overall_progress >= 100).length;
  const avgCompletion =
    list.length > 0
      ? Math.round(
          list.reduce((sum, p) => sum + p.overall_progress, 0) / list.length
        )
      : 0;

  return (
    <div className={classes.dashboard}>
      <PageBreadcrumb>Home → Projects</PageBreadcrumb>

      <div
        className={classes.statsRow}
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        <StatCard label="Active projects" value={inProgress} accent />
        <StatCard label="Library citations" value={list.length} />
        <StatCard
          label="Completion"
          value={`${avgCompletion}%`}
          sub={`${completed} ready to export`}
        />
      </div>

      <div className={classes.gridWrap}>
        <ToolbarRow
          left={
            <div>
              <PageTitleBlock
                title="Your research projects"
                subtitle="Manage your research proposals"
              />
            </div>
          }
          right={
            <Group gap={6}>
              <input
                className={classes.searchInput}
                placeholder="Search projects..."
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                style={{ width: 180 }}
              />
              <Button component={Link} to="/paper/new/purpose" size="xs">
                New project
              </Button>
            </Group>
          }
        />

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

        <p className={classes.projectHint}>
          Tip: click a project card to open workspace · create new from + button
        </p>
      </div>
    </div>
  );
}
