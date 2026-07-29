import type { IntegritySection } from "#app/services/library.server";
import type { ProjectMetadataIssue } from "#app/utils/project-metadata-export";
import { Form, Link } from "@remix-run/react";

import classes from "./review-proposal-v2.module.css";

type ProposalReadinessPanelProps = {
  paperId: string;
  percent: number;
  readyCount: number;
  totalCount: number;
  setupReady: boolean;
  writingReady: boolean;
  methodReady: boolean;
  referencesReady: boolean;
  metadataIssues: ProjectMetadataIssue[];
  integrity: {
    overall: string;
    sections: IntegritySection[];
  };
  isPending: boolean;
  onFixIntegrity?: () => void;
};

export function ProposalReadinessPanel({
  paperId,
  percent,
  readyCount,
  totalCount,
  setupReady,
  writingReady,
  methodReady,
  referencesReady,
  metadataIssues,
  integrity,
  isPending,
  onFixIntegrity,
}: ProposalReadinessPanelProps) {
  const issueCount = integrity.sections.reduce((sum, section) => {
    if (!section.summary) return sum;
    return (
      sum +
      (section.summary.unknown ?? 0) +
      (section.summary.unsupported ?? 0) +
      (section.summary.ambiguous ?? 0)
    );
  }, 0);

  const uncitedHint =
    integrity.overall === "fail" || integrity.overall === "pending"
      ? integrity.sections.some((s) => s.status === "issues")
      : false;

  return (
    <aside className={classes.statusPanel}>
      <div className={classes.statusTitle}>Proposal readiness</div>

      <div className={classes.progressCard}>
        <div className={classes.progressHeader}>
          <span className={classes.progressPercent}>{percent}% complete</span>
          <span className={classes.progressMeta}>
            {readyCount} / {totalCount} ready
          </span>
        </div>
        <div className={classes.progressBarBg}>
          <div
            className={classes.progressBarFill}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className={classes.checklist}>
          <div
            className={`${classes.checkItem} ${setupReady ? classes.checkItemDone : ""}`}
          >
            <span>Setup</span>
            <span>{setupReady ? "✓" : "○"}</span>
          </div>
          <div
            className={`${classes.checkItem} ${writingReady ? classes.checkItemDone : ""}`}
          >
            <span>Writing</span>
            <span>{writingReady ? "✓" : "○"}</span>
          </div>
          <div
            className={`${classes.checkItem} ${methodReady ? classes.checkItemDone : ""}`}
          >
            <span>Method</span>
            <span>{methodReady ? "✓" : "○"}</span>
          </div>
          <div
            className={`${classes.checkItem} ${referencesReady ? classes.checkItemDone : ""}`}
          >
            <span>References</span>
            <span>{referencesReady ? "✓" : "○"}</span>
          </div>
        </div>
      </div>

      <div className={classes.integrityCard}>
        <div className={classes.statusTitle}>Title page metadata</div>
        {metadataIssues.length === 0 ? (
          <div className={`${classes.integrityLine} ${classes.integrityOk}`}>
            ✓ Authors and affiliations set
          </div>
        ) : (
          <>
            {metadataIssues.includes("authors") ? (
              <div className={`${classes.integrityLine} ${classes.integrityWarn}`}>
                ⚠ No authors for export title page
              </div>
            ) : null}
            {metadataIssues.includes("affiliations") ? (
              <div className={`${classes.integrityLine} ${classes.integrityWarn}`}>
                ⚠ No affiliations for export title page
              </div>
            ) : null}
            <Link
              to={`/paper/${paperId}/settings/edit`}
              className={classes.metadataSettingsLink}
            >
              Fix in Project settings
            </Link>
          </>
        )}
      </div>

      <div className={classes.integrityCard}>
        <div className={classes.statusTitle}>Integrity check</div>
        {integrity.overall === "pass" ? (
          <div className={`${classes.integrityLine} ${classes.integrityOk}`}>
            ✓ Reference integrity passed
          </div>
        ) : integrity.overall === "pending" ? (
          <div className={classes.integrityLine}>Checking citations…</div>
        ) : integrity.overall === "not_run" ? (
          <div className={classes.integrityLine}>
            Run integrity check before export.
          </div>
        ) : (
          <>
            {issueCount > 0 ? (
              <div className={`${classes.integrityLine} ${classes.integrityWarn}`}>
                ⚠ {issueCount} citation issue(s) found
              </div>
            ) : null}
            {uncitedHint ? (
              <div className={`${classes.integrityLine} ${classes.integrityWarn}`}>
                ⚠ Some library sources may be uncited in text
              </div>
            ) : null}
          </>
        )}
        <Form method="post">
          <input type="hidden" name="paperId" value={paperId} />
          <button
            type="submit"
            name="intent"
            value="run-integrity"
            className={classes.fixBtn}
            disabled={isPending}
          >
            {integrity.overall === "not_run"
              ? "Run integrity check"
              : "Re-run integrity check"}
          </button>
        </Form>
        {onFixIntegrity && integrity.overall === "fail" ? (
          <button
            type="button"
            className={classes.fixBtn}
            onClick={onFixIntegrity}
          >
            View issues
          </button>
        ) : null}
      </div>
    </aside>
  );
}
