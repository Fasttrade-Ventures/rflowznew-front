import type { LibraryEntry } from "#app/services/library.server";
import type { ProblemStatementActionData } from "#app/routes/paper+/$paperId+/problem-statement+/form";
import { PaperProblemStatementSchema } from "#app/routes/paper+/$paperId+/problem-statement+/form";
import useAbly from "#app/components/hooks/useAbly";
import { getFormProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Alert, Anchor, Button, Textarea } from "@mantine/core";
import { useFetcher } from "@remix-run/react";
import Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpinDelay } from "spin-delay";

import classes from "./problem-statement-v2.module.css";

type ProblemField =
  | "motivational_problem"
  | "gap_in_practice"
  | "research_problem"
  | "gap_in_research";

type LegConfig = {
  title: string;
  gapLabel: string;
  problemField: "motivational_problem" | "research_problem";
  gapField: "gap_in_practice" | "gap_in_research";
  evidenceLabel: string;
  evidenceKind: "web" | "academic";
  ablyEventName: string;
};

const LEGS: LegConfig[] = [
  {
    title: "Leg 1 — Motivational (policy/media)",
    gapLabel: "→ Motivational gap",
    problemField: "motivational_problem",
    gapField: "gap_in_practice",
    evidenceLabel: "Evidence linked (auto from library citations)",
    evidenceKind: "web",
    ablyEventName: "problem-statement-motivational_problem",
  },
  {
    title: "Leg 2 — Research (literature)",
    gapLabel: "→ Research gap",
    problemField: "research_problem",
    gapField: "gap_in_research",
    evidenceLabel: "Evidence linked (auto from saved literature)",
    evidenceKind: "academic",
    ablyEventName: "problem-statement-research_problem",
  },
];

function evidenceLabel(entry: LibraryEntry, index: number) {
  const prefix = `[${index + 1}]`;
  const title =
    entry.title.length > 42 ? `${entry.title.slice(0, 42)}…` : entry.title;
  return `${prefix} ${title}`;
}

function legGapHeading(leg: LegConfig) {
  return leg.problemField === "motivational_problem"
    ? "Motivational gap:"
    : "Research gap:";
}

function combineLegText(
  problem: string,
  gap: string,
  leg: LegConfig
): string {
  if (!problem && !gap) return "";
  if (!gap) return problem;
  if (!problem) return `${legGapHeading(leg)} ${gap}`;
  return `${problem}\n\n${legGapHeading(leg)} ${gap}`;
}

function splitLegText(
  combined: string,
  leg: LegConfig
): { problem: string; gap: string } {
  const marker =
    leg.problemField === "motivational_problem"
      ? /(?:^|\n\n)Motivational gap:\s*/i
      : /(?:^|\n\n)Research gap:\s*/i;
  const match = combined.match(marker);
  if (!match || match.index === undefined) {
    return { problem: combined.trim(), gap: "" };
  }
  return {
    problem: combined.slice(0, match.index).trim(),
    gap: combined.slice(match.index + match[0].length).trim(),
  };
}

function LegEditor({
  leg,
  paperId,
  formUrl,
  problemFieldName,
  gapFieldName,
  problemErrors,
  gapErrors,
  problemValue,
  gapValue,
  onProblemChange,
  onGapChange,
  evidence,
}: {
  leg: LegConfig;
  paperId: string;
  formUrl: string;
  problemFieldName: string;
  gapFieldName: string;
  problemErrors?: string[];
  gapErrors?: string[];
  problemValue: string;
  gapValue: string;
  onProblemChange: (value: string) => void;
  onGapChange: (value: string) => void;
  evidence: LibraryEntry[];
}) {
  const aiFetcher = useFetcher<ProblemStatementActionData>();
  const [isGenerating, setIsGenerating] = useState(false);
  const streamRef = useRef("");

  const combinedValue = combineLegText(problemValue, gapValue, leg);

  const applyCombinedText = useCallback(
    (text: string) => {
      const { problem, gap } = splitLegText(text, leg);
      onProblemChange(problem);
      onGapChange(gap);
    },
    [leg, onProblemChange, onGapChange]
  );

  const handleMessage = useCallback(
    (message: Ably.Message) => {
      if (message.data === "[DONE]") {
        setIsGenerating(false);
        streamRef.current = "";
        return;
      }
      streamRef.current += String(message.data);
      applyCombinedText(streamRef.current);
    },
    [applyCombinedText]
  );

  useAbly(paperId, leg.ablyEventName, handleMessage);

  const askProfZ = () => {
    streamRef.current = "";
    onProblemChange("");
    onGapChange("");
    setIsGenerating(true);
    aiFetcher.submit(
      {
        intent: "generateAiResponse",
        paperId,
        field: leg.problemField,
        ablyEventName: leg.ablyEventName,
      },
      { method: "post", action: formUrl }
    );
  };

  useEffect(() => {
    if (aiFetcher.data?.serverError) {
      setIsGenerating(false);
    }
  }, [aiFetcher.data]);

  const sourcesLabel =
    leg.evidenceKind === "academic"
      ? `${evidence.length} paper${evidence.length === 1 ? "" : "s"} linked`
      : `${evidence.length} source${evidence.length === 1 ? "" : "s"} linked`;

  const visibleEvidence = evidence.slice(0, 3);
  const moreCount = evidence.length - visibleEvidence.length;

  return (
    <section className={classes.legCard}>
      <div className={classes.legHeader}>
        <div>
          <div className={classes.legTitle}>{leg.title}</div>
          <div className={classes.legGapLabel}>{leg.gapLabel}</div>
        </div>
        <div className={classes.legActions}>
          <span className={classes.sourcesBadge}>{sourcesLabel}</span>
          <button
            type="button"
            className={classes.askProfZ}
            onClick={askProfZ}
            disabled={isGenerating || aiFetcher.state !== "idle"}
          >
            <span className={classes.profAvatar} aria-hidden />
            Ask Prof Z
            <span aria-hidden>✨✨✨</span>
          </button>
        </div>
      </div>

      <div className={classes.editorShell}>
        <div className={classes.editorToolbar}>
          <span className={classes.toolbarStrong}>B</span>
          <span className={classes.toolbarItalic}>I</span>
          <span>U</span>
          <span>·</span>
          <span className={classes.toolbarLink}>Link</span>
          <span className={classes.toolbarHint}>Rich text</span>
        </div>
        <div className={classes.editorBody}>
          <Textarea
            value={combinedValue}
            onChange={(e) => applyCombinedText(e.currentTarget.value)}
            minRows={8}
            autosize
            disabled={isGenerating}
            placeholder={
              leg.evidenceKind === "web"
                ? "Describe the real-world problem using policy/media evidence, then add Motivational gap: …"
                : "Synthesise the literature with in-text citations, then add Research gap: …"
            }
            error={
              [...(problemErrors ?? []), ...(gapErrors ?? [])].length > 0
                ? [...(problemErrors ?? []), ...(gapErrors ?? [])]
                : undefined
            }
          />
          <input type="hidden" name={problemFieldName} value={problemValue} />
          <input type="hidden" name={gapFieldName} value={gapValue} />
        </div>
      </div>

      <div className={classes.evidenceSection}>
        <div className={classes.evidenceLabel}>{leg.evidenceLabel}</div>
        <div className={classes.evidenceChips}>
          {visibleEvidence.length === 0 ? (
            <span className={classes.evidenceEmpty}>
              No cited sources yet — tick Cite in Library for{" "}
              {leg.evidenceKind === "web" ? "policy/media" : "literature"} sources.
            </span>
          ) : (
            <>
              {visibleEvidence.map((entry, index) =>
                entry.url ? (
                  <Anchor
                    key={entry.id}
                    href={entry.url}
                    target="_blank"
                    className={classes.evidenceChip}
                  >
                    {evidenceLabel(entry, index)} ↗
                  </Anchor>
                ) : (
                  <span key={entry.id} className={classes.evidenceChip}>
                    {evidenceLabel(entry, index)}
                  </span>
                )
              )}
              {moreCount > 0 && (
                <span className={classes.sourcesBadge}>+{moreCount} more</span>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function ProblemStatementV2Screen({
  paperId,
  actionData,
  initialValues,
  libraryEntries,
}: {
  paperId: string;
  actionData?: ProblemStatementActionData;
  initialValues: {
    motivational_problem: string;
    gap_in_practice: string;
    research_problem: string;
    gap_in_research: string;
  };
  libraryEntries: LibraryEntry[];
}) {
  const fetcher = useFetcher<ProblemStatementActionData>();
  const formUrl = `/paper/${paperId}/problem-statement/form`;

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues({
      motivational_problem: initialValues.motivational_problem,
      gap_in_practice: initialValues.gap_in_practice,
      research_problem: initialValues.research_problem,
      gap_in_research: initialValues.gap_in_research,
    });
  }, [
    initialValues.motivational_problem,
    initialValues.gap_in_practice,
    initialValues.research_problem,
    initialValues.gap_in_research,
  ]);

  const [form, fields] = useForm({
    id: "problem-statement-v2",
    lastResult: actionData?.lastResult || fetcher.data?.lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: PaperProblemStatementSchema });
    },
    shouldValidate: "onSubmit",
    defaultValue: initialValues,
  });

  const isPending = fetcher.state !== "idle";
  const isDelayedPending = useSpinDelay(isPending, {
    delay: 200,
    minDuration: 500,
  });

  const citedWeb = libraryEntries.filter(
    (entry) => entry.is_cited && entry.kind === "web"
  );
  const citedAcademic = libraryEntries.filter(
    (entry) => entry.is_cited && entry.kind === "academic"
  );

  const setField = (field: ProblemField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className={classes.shell}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitle}>Problem statement</div>
        <div className={classes.pageSub}>
          Assemble motivational leg (policy/media) and research leg (literature) —
          each with linked evidence
        </div>
      </div>

      <fetcher.Form
        method="post"
        action={formUrl}
        {...getFormProps(form)}
        className={classes.body}
      >
        <input type="hidden" name="paperId" value={paperId} />
        <input type="hidden" name="intent" value="save_all" />

        {form.errors && form.errors.length > 0 && (
          <Alert color="red" variant="light">
            {form.errors.join(" ")}
          </Alert>
        )}

        {actionData?.serverError && (
          <Alert color="red" variant="light">
            {actionData.serverError}
          </Alert>
        )}

        {LEGS.map((leg) => (
          <LegEditor
            key={leg.problemField}
            leg={leg}
            paperId={paperId}
            formUrl={formUrl}
            problemFieldName={leg.problemField}
            gapFieldName={leg.gapField}
            problemErrors={fields[leg.problemField].errors}
            gapErrors={fields[leg.gapField].errors}
            problemValue={values[leg.problemField]}
            gapValue={values[leg.gapField]}
            onProblemChange={(value) => setField(leg.problemField, value)}
            onGapChange={(value) => setField(leg.gapField, value)}
            evidence={
              leg.evidenceKind === "web" ? citedWeb : citedAcademic
            }
          />
        ))}

        <div className={classes.footer}>
          <Button type="submit" size="compact-sm" loading={isDelayedPending}>
            Save problem statement
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
