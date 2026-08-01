import type { LibraryEntry } from "#app/services/library.server";
import {
  formatApaReference,
  getCitedLibraryEntries,
} from "#app/utils/format-library-reference";
import { Button } from "@mantine/core";
import { Link } from "@remix-run/react";

import classes from "./review-proposal-v2.module.css";

type ApaReferencesPanelProps = {
  paperId: string;
  libraryEntries: LibraryEntry[];
  stitchedReferences: string;
};

const KIND_LABEL: Record<LibraryEntry["kind"], string> = {
  academic: "Academic",
  web: "Web / policy / media",
};

export function ApaReferencesPanel({
  paperId,
  libraryEntries,
  stitchedReferences,
}: ApaReferencesPanelProps) {
  const cited = getCitedLibraryEntries(libraryEntries);
  const academicCount = cited.filter((e) => e.kind === "academic").length;
  const webCount = cited.filter((e) => e.kind === "web").length;

  return (
    <div className={classes.tabPanel}>
      <div className={classes.docHeader} style={{ marginBottom: 10 }}>
        <div>
          <div className={classes.docTitle}>APA 7 reference list</div>
          <div className={classes.pageSub}>
            {cited.length} cited source(s) · {academicCount} academic ·{" "}
            {webCount} web/policy/media
          </div>
        </div>
        <Button component={Link} to={`/paper/${paperId}/library`} variant="outline" size="xs">
          Manage library
        </Button>
      </div>

      {cited.length === 0 ? (
        <p className={classes.pageSub}>
          No cited library entries yet. Mark sources as cited on the Library
          screen to compile your reference list.
        </p>
      ) : (
        <div className={classes.apaList}>
          {cited.map((entry) => (
            <div key={entry.id} className={classes.apaItem}>
              <div>{formatApaReference(entry)}</div>
              <div className={classes.apaMeta}>
                {KIND_LABEL[entry.kind]}
                {entry.url ? ` · ${entry.url}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {stitchedReferences.trim() ? (
        <>
          <div className={classes.statusTitle} style={{ marginTop: 12 }}>
            Stitched into proposal
          </div>
          <pre
            style={{
              fontSize: 10,
              lineHeight: 1.5,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {stitchedReferences}
          </pre>
        </>
      ) : null}
    </div>
  );
}
