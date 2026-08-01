import {
  getLibraryEntries,
  removeLibraryEntry,
  type LibraryEntry,
} from "#app/services/library.server";
import { requireAuth } from "#app/services/authentication.server";
import { getPapers } from "#app/services/paper.server";
import { invariant } from "@epic-web/invariant";
import { ActionIcon, Badge, Button, Tooltip } from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useMemo, useState } from "react";

import { Icon } from "#app/components/icon";
import {
  DataTable,
  PageBreadcrumb,
  PageTitleBlock,
  StatPill,
} from "#app/components/v2/V2UIKit";
import classes from "#app/components/v2/v2.module.css";

type AggregatedEntry = LibraryEntry & {
  paperTitle: string;
};

type KindFilter = "all" | "academic" | "web";
type CitedFilter = "all" | "cited" | "saved";

function truncateText(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function projectLabel(title: string, mobile = false): string {
  return truncateText(title, mobile ? 36 : 72);
}

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
    academicCount: entries.filter((entry) => entry.kind === "academic").length,
    webCount: entries.filter((entry) => entry.kind === "web").length,
    citedCount: entries.filter((entry) => entry.is_cited).length,
    savedOnlyCount: entries.filter((entry) => !entry.is_cited).length,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAuth({ request });
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "remove") {
    const paperId = formData.get("paperId");
    const entryId = formData.get("entryId");
    invariant(typeof paperId === "string" && paperId, "paperId is required");
    invariant(typeof entryId === "string" && entryId, "entryId is required");

    await removeLibraryEntry({ request, paperId, entryId });
    return json({ ok: true, intent: "remove" as const });
  }

  return json({ ok: false }, { status: 400 });
};

function RemoveEntryButton({
  paperId,
  entryId,
}: {
  paperId: string;
  entryId: number;
}) {
  const fetcher = useFetcher<typeof action>();

  return (
    <fetcher.Form
      method="post"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Remove this source from the project library? It will be deleted from that project only."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="intent" value="remove" />
      <input type="hidden" name="paperId" value={paperId} />
      <input type="hidden" name="entryId" value={String(entryId)} />
      <Tooltip label="Remove from project">
        <ActionIcon
          type="submit"
          variant="subtle"
          color="red"
          size="sm"
          aria-label="Remove from project"
          loading={fetcher.state !== "idle"}
        >
          <Icon name="pika-delete" style={{ width: 14, height: 14 }} />
        </ActionIcon>
      </Tooltip>
    </fetcher.Form>
  );
}

function CitedStatusBadge({ isCited }: { isCited: boolean }) {
  return (
    <Badge size="xs" variant={isCited ? "filled" : "outline"} color={isCited ? "blue" : "gray"}>
      {isCited ? "Cited" : "Saved only"}
    </Badge>
  );
}

export default function HomeLibraryPage() {
  const { entries, projectCount, academicCount, webCount, citedCount, savedOnlyCount } =
    useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [citedFilter, setCitedFilter] = useState<CitedFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (kindFilter !== "all" && entry.kind !== kindFilter) return false;
      if (citedFilter === "cited" && !entry.is_cited) return false;
      if (citedFilter === "saved" && entry.is_cited) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.paperTitle.toLowerCase().includes(q) ||
        (entry.source?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [entries, kindFilter, citedFilter, query]);

  return (
    <div className={classes.dashboard}>
      <PageBreadcrumb>Home → Library</PageBreadcrumb>
      <PageTitleBlock
        title="All sources"
        subtitle="Saved library entries across projects — includes sources marked cited and saved-only."
      />

      <div className={classes.filterChips}>
        <StatPill label="Total sources" value={entries.length} />
        <StatPill label="Cited" value={citedCount} accent />
        <StatPill label="Saved only" value={savedOnlyCount} />
        <StatPill label="Academic" value={academicCount} />
        <StatPill label="Policy/Media" value={webCount} />
        <StatPill label="Projects" value={projectCount} />
      </div>

      <div className={classes.libraryToolbar}>
        <input
          className={classes.searchInput}
          placeholder="Search sources..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          aria-label="Search sources"
        />
        <div className={classes.filterChips}>
          {(
            [
              ["all", "All"],
              ["academic", "Academic"],
              ["web", "Policy/Media"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              size="xs"
              variant={kindFilter === value ? "filled" : "outline"}
              onClick={() => setKindFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className={classes.filterChips}>
          {(
            [
              ["all", "All status"],
              ["cited", "Cited"],
              ["saved", "Saved only"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              size="xs"
              variant={citedFilter === value ? "filled" : "outline"}
              onClick={() => setCitedFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className={classes.libraryListWrap}>
        <div className={classes.dataTableDesktop}>
          <DataTable
            columns={[
              { key: "source", label: "Source" },
              { key: "type", label: "Type", width: "96px" },
              { key: "status", label: "Status", width: "88px" },
              { key: "year", label: "Year", width: "64px" },
              { key: "project", label: "Project" },
              { key: "actions", label: "", width: "88px", align: "right" },
            ]}
            rows={filtered.map((entry) => ({
              id: `${entry.paper_id}-${entry.id}`,
              cells: {
                source: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{entry.title}</div>
                    <div
                      style={{
                        color: "var(--rz-muted-foreground)",
                        fontSize: 10,
                      }}
                    >
                      {entry.source ?? entry.url ?? "Unknown source"}
                    </div>
                  </div>
                ),
                type: (
                  <Badge size="xs" variant="light">
                    {entry.kind}
                  </Badge>
                ),
                status: <CitedStatusBadge isCited={Boolean(entry.is_cited)} />,
                year: entry.year ?? "—",
                project: (
                  <Link
                    to={`/paper/${entry.paper_id}/library`}
                    title={entry.paperTitle}
                    style={{ color: "var(--rz-primary)", fontSize: 11 }}
                  >
                    {projectLabel(entry.paperTitle)}
                  </Link>
                ),
                actions: (
                  <div className={classes.libraryRowActions}>
                    <Link
                      to={`/paper/${entry.paper_id}/library`}
                      style={{ color: "var(--rz-primary)", fontSize: 11 }}
                    >
                      Open
                    </Link>
                    <RemoveEntryButton
                      paperId={String(entry.paper_id)}
                      entryId={entry.id}
                    />
                  </div>
                ),
              },
            }))}
            emptyMessage="No sources yet. Open a project and add entries from Source Library."
          />
        </div>

        <div className={classes.mobileCardList}>
          {filtered.length === 0 ? (
            <div className={classes.mobileCard}>
              <div className={classes.mobileCardMeta}>
                No sources yet. Open a project and add entries from Source Library.
              </div>
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={`${entry.paper_id}-${entry.id}`}
                className={classes.mobileCard}
              >
                <div className={classes.mobileCardTitle}>{entry.title}</div>
                <div className={classes.mobileCardMeta}>
                  {entry.source ?? entry.url ?? "Unknown source"}
                </div>
                <div className={classes.mobileCardRow}>
                  <Badge size="xs" variant="light">
                    {entry.kind}
                  </Badge>
                  <CitedStatusBadge isCited={Boolean(entry.is_cited)} />
                  <span className={classes.mobileCardMeta}>
                    {entry.year ?? "—"}
                  </span>
                  <RemoveEntryButton
                    paperId={String(entry.paper_id)}
                    entryId={entry.id}
                  />
                </div>
                <Link
                  to={`/paper/${entry.paper_id}/library`}
                  title={entry.paperTitle}
                  className={classes.mobileProjectLink}
                >
                  {projectLabel(entry.paperTitle, true)}
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
