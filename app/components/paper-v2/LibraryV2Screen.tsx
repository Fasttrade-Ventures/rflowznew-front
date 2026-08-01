import type { LibraryEntry } from "#app/services/library.server";
import type { OpenAlexWork } from "#app/services/openalex.server";
import type { WebSearchResult } from "#app/services/library.server";
import { Anchor, Button, Group } from "@mantine/core";
import type { ReactNode } from "react";

import classes from "./library-v2.module.css";

function formatAuthors(work: OpenAlexWork): string {
  if (work.authors.length === 0) return "Unknown authors";
  const first = work.authors[0];
  const name = [first.first_name, first.last_name].filter(Boolean).join(" ");
  if (work.authors.length === 1) return name;
  return `${name} et al.`;
}

function academicMeta(work: OpenAlexWork): string {
  const parts = [
    formatAuthors(work),
    work.year?.toString() ?? "n.d.",
    work.venue ?? "Unknown venue",
    work.doi ? "DOI verified" : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function webMeta(result: WebSearchResult): string {
  let host = result.url;
  try {
    host = new URL(result.url).host;
  } catch {
    /* keep url */
  }
  const parts = [host, "Web evidence", result.summary ? "Summary available" : "URL captured"];
  return parts.join(" · ");
}

type LibraryV2ScreenProps = {
  paperId: string;
  paperTitle?: string;
  entries: LibraryEntry[];
  academicQuery: string;
  policyQuery: string;
  onAcademicQueryChange: (value: string) => void;
  onPolicyQueryChange: (value: string) => void;
  academicWorks: OpenAlexWork[];
  policyResults: WebSearchResult[];
  academicFailed?: boolean;
  policyFailed?: boolean;
  academicForm: ReactNode;
  policyForm: ReactNode;
  renderAcademicSave: (work: OpenAlexWork, saved: boolean) => ReactNode;
  renderWebSave: (result: WebSearchResult, saved: boolean) => ReactNode;
  renderAcademicCite: (
    work: OpenAlexWork,
    savedEntry: LibraryEntry | undefined
  ) => ReactNode;
  renderWebCite: (
    result: WebSearchResult,
    savedEntry: LibraryEntry | undefined
  ) => ReactNode;
  renderCiteControl: (entry: LibraryEntry) => ReactNode;
  renderRemove: (entry: LibraryEntry) => ReactNode;
  manualCitationButton: ReactNode;
  attachedCount: number;
};

export function LibraryV2Screen({
  paperId,
  paperTitle,
  entries,
  academicQuery,
  policyQuery,
  onAcademicQueryChange,
  onPolicyQueryChange,
  academicWorks,
  policyResults,
  academicFailed,
  policyFailed,
  academicForm,
  policyForm,
  renderAcademicSave,
  renderWebSave,
  renderAcademicCite,
  renderWebCite,
  renderCiteControl,
  renderRemove,
  manualCitationButton,
  attachedCount,
}: LibraryV2ScreenProps) {
  const academicEntries = entries.filter((e) => e.kind === "academic");
  const webEntries = entries.filter((e) => e.kind === "web");
  const searchResultsCount = academicWorks.length + policyResults.length;

  const findAcademicEntry = (work: OpenAlexWork) =>
    academicEntries.find((e) => e.openalex_id === work.openalex_id);

  const findWebEntry = (result: WebSearchResult) =>
    webEntries.find((e) => e.url === result.url);

  const exportActions = (
    <Group gap={6} className={classes.headerActions}>
      {manualCitationButton}
      {(["bibtex", "ris", "xml"] as const).map((format) => (
        <Button
          key={format}
          component="a"
          href={`/resources/library-export?paperId=${paperId}&format=${format}`}
          variant="outline"
          size="compact-xs"
          disabled={academicEntries.length === 0}
        >
          {format === "bibtex" ? "BibTeX" : format.toUpperCase()}
        </Button>
      ))}
    </Group>
  );

  return (
    <div className={classes.shell}>
      <div className={classes.pageHeader}>
        <div>
          <div className={classes.pageTitle}>Source Library</div>
          <div className={classes.pageSub}>
            Search and save sources to library. Tick Cite to mark sources for use
            across all sections in this paper.
          </div>
        </div>
        {exportActions}
      </div>

      <div className={classes.statsRow}>
        <div className={classes.statCard}>
          <span className={classes.statLabel}>Search results</span>
          <span className={classes.statValue}>{searchResultsCount}</span>
        </div>
        <div className={classes.statCard}>
          <span className={classes.statLabel}>In library</span>
          <span className={`${classes.statValue} ${classes.statValueAccent}`}>
            {entries.length}
          </span>
        </div>
        <div className={classes.statCard}>
          <span className={classes.statLabel}>Used as citation</span>
          <span className={classes.statValue}>
            {attachedCount} / {entries.length}
          </span>
        </div>
      </div>

      <div className={classes.dualBody}>
        {/* Literature search */}
        <section className={classes.panel}>
          <div className={classes.panelHeader}>
            <span className={classes.panelTitle}>Literature search</span>
            <span className={classes.badge}>Academic RAG</span>
          </div>
          <span className={classes.prefillNote}>Prefilled from refined statement</span>
          <div className={`${classes.searchRow} inputButtonRow`}>
            <input
              className={classes.searchInput}
              name="q"
              value={academicQuery}
              onChange={(e) => onAcademicQueryChange(e.currentTarget.value)}
              placeholder='Boolean supported: "crop yield" AND (ml OR ai)'
              form="library-academic-search"
            />
            {academicForm}
          </div>
          <p className={classes.hint}>
            Save = library only · tick Cite = active for this paper (works without
            search running)
          </p>
          {academicFailed && (
            <p className={classes.errorText}>
              Academic search is temporarily unavailable.
            </p>
          )}
          <div className={classes.resultsTable}>
            <div className={classes.tableHeader}>
              <span>Cite</span>
              <span>Source</span>
              <span style={{ textAlign: "right" }}>Library</span>
            </div>
            <div className={classes.scrollBody}>
              {academicWorks.length === 0 && academicEntries.length === 0 && (
                <p className={classes.emptyState}>
                  Run a search to see academic sources.
                </p>
              )}
              {academicWorks.map((work) => (
                <div key={work.openalex_id} className={classes.tableRow}>
                  {renderAcademicCite(work, findAcademicEntry(work))}
                  <div>
                    <div className={classes.rowTitle}>{work.title}</div>
                    <div className={classes.rowMeta}>{academicMeta(work)}</div>
                  </div>
                  {renderAcademicSave(
                    work,
                    academicEntries.some((e) => e.openalex_id === work.openalex_id)
                  )}
                </div>
              ))}
              {academicWorks.length === 0 &&
                academicEntries.map((entry) => (
                  <div key={entry.id} className={classes.tableRow}>
                    {renderCiteControl(entry)}
                    <div>
                      <div className={classes.rowTitle}>{entry.title}</div>
                      <div className={classes.rowMeta}>
                        {[entry.source, entry.year].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className={classes.rowActions}>
                      {entry.url && (
                        <Anchor href={entry.url} target="_blank" size="xs">
                          Open
                        </Anchor>
                      )}
                      <Button size="compact-xs" variant="light" disabled>
                        Saved
                      </Button>
                      {renderRemove(entry)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Policy & media search */}
        <section className={classes.panel}>
          <div className={classes.panelHeader}>
            <span className={classes.panelTitle}>Policy &amp; media search</span>
            <span className={classes.badge}>Web evidence</span>
          </div>
          <span className={classes.prefillNote}>
            {paperTitle ? "Prefilled from project title" : "Prefilled from topic"}
          </span>
          <div className={`${classes.searchRow} inputButtonRow`}>
            <input
              className={classes.searchInput}
              name="q"
              value={policyQuery}
              onChange={(e) => onPolicyQueryChange(e.currentTarget.value)}
              placeholder={
                paperTitle
                  ? `${paperTitle.slice(0, 60)} policy media`
                  : "e.g. national precision agriculture policy"
              }
              form="library-policy-search"
            />
            {policyForm}
          </div>
          <p className={classes.hint}>
            Save = library only · tick Cite = active for this paper (works without
            search running)
          </p>
          {policyFailed && (
            <p className={classes.errorText}>
              Web search is temporarily unavailable.
            </p>
          )}
          <div className={classes.resultsTable}>
            <div className={`${classes.tableHeader} ${classes.policyRow}`}>
              <span>Cite</span>
              <span />
              <span>Source</span>
            </div>
            <div className={classes.scrollBody}>
              {policyResults.length === 0 && webEntries.length === 0 && (
                <p className={classes.emptyState}>
                  Run a search to see policy and media sources.
                </p>
              )}
              {policyResults.map((result) => (
                <div key={result.url} className={`${classes.tableRow} ${classes.policyRow}`}>
                  {renderWebCite(result, findWebEntry(result))}
                  <div className={classes.rowActions}>
                    <Anchor href={result.url} target="_blank" size="xs">
                      Open
                    </Anchor>
                    {renderWebSave(
                      result,
                      webEntries.some((e) => e.url === result.url)
                    )}
                  </div>
                  <div>
                    <div className={classes.rowTitle}>{result.title}</div>
                    <div className={classes.rowMeta}>{webMeta(result)}</div>
                  </div>
                </div>
              ))}
              {policyResults.length === 0 &&
                webEntries.map((entry) => (
                  <div key={entry.id} className={`${classes.tableRow} ${classes.policyRow}`}>
                    {renderCiteControl(entry)}
                    <div className={classes.rowActions}>
                      {entry.url && (
                        <Anchor href={entry.url} target="_blank" size="xs">
                          Open
                        </Anchor>
                      )}
                      <Button size="compact-xs" variant="light" disabled>
                        Saved
                      </Button>
                      {renderRemove(entry)}
                    </div>
                    <div>
                      <div className={classes.rowTitle}>{entry.title}</div>
                      <div className={classes.rowMeta}>
                        {[entry.source, entry.year].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
