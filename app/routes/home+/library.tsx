import { getLibraryEntries, type LibraryEntry } from "#app/services/library.server";
import { requireAuth } from "#app/services/authentication.server";
import { getPapers } from "#app/services/paper.server";
import { Badge, Button, Group } from "@mantine/core";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useMemo, useState } from "react";

import {
  DataTable,
  PageBreadcrumb,
  PageTitleBlock,
  StatPill,
  ToolbarRow,
} from "#app/components/v2/V2UIKit";
import classes from "#app/components/v2/v2.module.css";

type AggregatedEntry = LibraryEntry & {
  paperTitle: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth({ request });
  const papersRes = await getPapers({ request });
  const papers = papersRes.data?.papers ?? [];

  const entriesByPaper = await Promise.all(
    papers.map(async (paper) => {
      const res = await getLibraryEntries({
        request,
        paperId: String(paper.id),
      });
      return {
        paperId: paper.id,
        paperTitle: paper.title,
        entries: res.data?.entries ?? [],
      };
    })
  );

  const entries: AggregatedEntry[] = entriesByPaper.flatMap((group) =>
    group.entries.map((entry) => ({
      ...entry,
      paperTitle: group.paperTitle,
    }))
  );

  return json({
    entries,
    projectCount: papers.length,
    academicCount: entries.filter((e) => e.kind === "academic").length,
    webCount: entries.filter((e) => e.kind === "web").length,
  });
};

export default function HomeLibraryPage() {
  const { entries, projectCount, academicCount, webCount } =
    useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.paperTitle.toLowerCase().includes(q) ||
        (e.source?.toLowerCase().includes(q) ?? false)
    );
  }, [entries, query]);

  return (
    <div className={classes.dashboard}>
      <PageBreadcrumb>Home → Library</PageBreadcrumb>
      <PageTitleBlock
        title="All citations"
        subtitle="Citations saved across all your research projects"
        actions={
          <Button variant="outline" size="xs">
            Filter
          </Button>
        }
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <StatPill label="Total citations" value={entries.length} />
        <StatPill label="Academic" value={academicCount} accent />
        <StatPill label="Policy/Media" value={webCount} />
        <StatPill label="Projects" value={projectCount} />
      </div>

      <ToolbarRow
        left={
          <input
            className={classes.searchInput}
            placeholder="Search citations..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            style={{ maxWidth: 360 }}
          />
        }
        right={
          <Group gap={6}>
            <Button variant="outline" size="xs">
              Filter
            </Button>
            <Button variant="outline" size="xs">
              Export
            </Button>
          </Group>
        }
      />

      <DataTable
        columns={[
          { key: "source", label: "Source" },
          { key: "type", label: "Type", width: "96px" },
          { key: "year", label: "Year", width: "64px" },
          { key: "project", label: "Project" },
          { key: "open", label: "Open", width: "72px", align: "right" },
        ]}
        rows={filtered.map((entry) => ({
          id: `${entry.paper_id}-${entry.id}`,
          cells: {
            source: (
              <div>
                <div style={{ fontWeight: 500 }}>{entry.title}</div>
                <div style={{ color: "var(--rz-muted-foreground)", fontSize: 10 }}>
                  {entry.source ?? entry.url ?? "Unknown source"}
                </div>
              </div>
            ),
            type: (
              <Badge size="xs" variant="light">
                {entry.kind}
              </Badge>
            ),
            year: entry.year ?? "—",
            project: (
              <Link
                to={`/paper/${entry.paper_id}/library`}
                style={{ color: "var(--rz-primary)", fontSize: 11 }}
              >
                {entry.paperTitle}
              </Link>
            ),
            open: (
              <Link
                to={`/paper/${entry.paper_id}/library`}
                style={{ color: "var(--rz-primary)", fontSize: 11 }}
              >
                Open →
              </Link>
            ),
          },
        }))}
        emptyMessage="No citations yet. Open a project and add sources from Source Library."
      />
    </div>
  );
}
