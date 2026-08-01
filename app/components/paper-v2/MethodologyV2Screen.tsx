import useAbly from "#app/components/hooks/useAbly";
import { RichTextEditorShell } from "#app/components/paper-v2/RichTextEditorShell";
import {
  buildMethodologyParagraph,
  DEFAULT_SAMPLING,
  designLabel,
  evaluateCoherenceClient,
  METHODOLOGY_ANALYSIS_OPTIONS,
  METHODOLOGY_COLLECTION_OPTIONS,
  METHODOLOGY_DESIGN_OPTIONS,
  suggestedDesignKey,
  type MethodologyV2FormValues,
} from "#app/utils/methodology-v2";
import { Alert, Button, Textarea } from "@mantine/core";
import Ably from "ably";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import classes from "./methodology-v2.module.css";

export function MethodologyV2Screen({
  paperId,
  philosophyParadigm,
  initial,
  saving,
  saveError,
  onSave,
  onAskProfZ,
}: {
  paperId: string;
  philosophyParadigm?: string | null;
  initial: MethodologyV2FormValues;
  saving?: boolean;
  saveError?: string | null;
  onSave: (values: MethodologyV2FormValues) => void;
  onAskProfZ?: (ablyEvent: string) => void;
}) {
  const [values, setValues] = useState<MethodologyV2FormValues>(initial);
  const [showOverride, setShowOverride] = useState(false);
  const [draftFocused, setDraftFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const streamRef = useRef("");
  const ablyEventName = "methodology-paragraph";

  useEffect(() => {
    if (isGenerating) return;
    setValues(initial);
  }, [
    initial.methodology_paragraph,
    initial.meta?.design,
    initial.meta?.analysis,
    initial.meta?.sampling,
    initial.meta?.coherence_overridden,
    initial.meta?.override_reason,
    (initial.meta?.collection ?? []).join(","),
  ]);

  const coherence = useMemo(
    () =>
      evaluateCoherenceClient({
        paradigm: philosophyParadigm,
        values,
      }),
    [philosophyParadigm, values]
  );

  const primaryWarning = coherence.warnings[0];

  const setMeta = (patch: Partial<MethodologyV2FormValues["meta"]>) => {
    setValues((current) => {
      const nextMeta = { ...current.meta, ...patch, coherence_overridden: false };
      const nextValues = { ...current, meta: nextMeta };
      const shouldDraft =
        nextMeta.design &&
        (nextMeta.collection?.length ?? 0) > 0 &&
        nextMeta.analysis &&
        !current.methodology_paragraph.trim();
      return {
        ...nextValues,
        methodology_paragraph: shouldDraft
          ? buildMethodologyParagraph(nextValues)
          : current.methodology_paragraph,
      };
    });
  };

  const switchToSuggestedDesign = () => {
    const suggested = suggestedDesignKey(coherence.suggested_design);
    if (!suggested) return;
    setShowOverride(false);
    setMeta({ design: suggested });
    setValues((current) => {
      const next = {
        ...current,
        meta: { ...current.meta, design: suggested, coherence_overridden: false },
      };
      return {
        ...next,
        methodology_paragraph: buildMethodologyParagraph(next),
      };
    });
  };

  const toggleCollection = (key: string) => {
    setValues((current) => {
      const collection = new Set(current.meta.collection ?? []);
      if (collection.has(key)) collection.delete(key);
      else collection.add(key);
      const next = {
        ...current,
        meta: { ...current.meta, collection: [...collection] },
      };
      return {
        ...next,
        methodology_paragraph:
          next.meta.design && collection.size > 0 && next.meta.analysis
            ? buildMethodologyParagraph(next)
            : current.methodology_paragraph,
      };
    });
  };

  const handleMessage = useCallback((message: Ably.Message) => {
    if (message.data === "[DONE]") {
      setIsGenerating(false);
      streamRef.current = "";
      return;
    }
    streamRef.current += String(message.data);
    setValues((current) => ({
      ...current,
      methodology_paragraph: streamRef.current,
    }));
  }, []);

  useAbly(paperId, ablyEventName, handleMessage);

  const askProfZ = () => {
    if (!onAskProfZ) return;
    streamRef.current = "";
    setValues((current) => ({ ...current, methodology_paragraph: "" }));
    setIsGenerating(true);
    onAskProfZ(ablyEventName);
  };

  const profZNote =
    values.meta.design === "yin_case_study" && primaryWarning
      ? "Use SELECT to pick your design — then Ask Prof Z to WRITE the paragraph. Yin was your supervisor's suggestion, but IPA fits your lived-experience question better."
      : values.meta.design === "ipa"
        ? "IPA aligns with your interpretivist philosophy. Ask Prof Z to draft the methodology paragraph from your selections above."
        : "Use SELECT to pick your design — then Ask Prof Z to WRITE the paragraph for your proposal.";

  return (
    <div className={classes.shell}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitleWrap}>
          <div className={classes.pageTitle}>Methodology</div>
          <div className={classes.pageSub}>
            Two steps: (1) SELECT your design & methods · (2) WRITE the
            methodology paragraph for your proposal
          </div>
        </div>
      </div>

      <div className={classes.body}>
        <section className={classes.howItWorks}>
          <div className={classes.howTitle}>How this screen works</div>
          <div className={classes.howText}>
            {`SELECT = click to choose Yin, IPA, interviews, analysis type
WRITE = rich text editor below — Prof Z drafts it, you edit
Coherence Engine only fires when your selections don't match your philosophy`}
          </div>
        </section>

        {primaryWarning && !values.meta.coherence_overridden ? (
          <section className={classes.coherenceEngine}>
            <div className={classes.coherenceHeader}>
              <span className={classes.coherenceTitle}>
                ⚠ Your SELECT doesn&apos;t match your philosophy
              </span>
              <span className={classes.mismatchBadge}>Review needed</span>
            </div>
            <div className={classes.coherenceMessage}>{primaryWarning.message}</div>
            <div className={classes.mismatchRow}>
              <span className={classes.mismatchLabel}>Philosophy</span>
              <span className={classes.mismatchValue}>
                {primaryWarning.philosophy ?? philosophyParadigm}
              </span>
              <span>→</span>
              <span className={classes.mismatchLabel}>Design (selected)</span>
              <span className={classes.mismatchBad}>
                {primaryWarning.selected_design ?? designLabel(values.meta.design)}
              </span>
              <span>✗</span>
              <span className={classes.mismatchGood}>
                Suggested: {primaryWarning.suggested_design}
              </span>
            </div>
            <div className={classes.coherenceActions}>
              <Button size="compact-sm" onClick={switchToSuggestedDesign}>
                Switch to {primaryWarning.suggested_design}
              </Button>
              <Button
                size="compact-sm"
                variant="default"
                onClick={() => setShowOverride((current) => !current)}
              >
                Override & document reason
              </Button>
            </div>
            {showOverride ? (
              <div className={classes.overrideBox}>
                <Textarea
                  value={values.meta.override_reason ?? ""}
                  onChange={(event) =>
                    setMeta({ override_reason: event.currentTarget.value })
                  }
                  minRows={2}
                  placeholder="Why are you keeping this design despite the mismatch?"
                />
                <Button
                  size="compact-sm"
                  variant="light"
                  disabled={!values.meta.override_reason?.trim()}
                  onClick={() =>
                    setMeta({ coherence_overridden: true })
                  }
                >
                  Confirm override
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className={classes.coherenceReport}>
          <span className={classes.reportLabel}>Coherence report:</span>
          {coherence.report.map((item) => (
            <span
              key={item.key}
              className={
                item.status === "ok" ? classes.reportChipOk : classes.reportChipFail
              }
            >
              {item.label} {item.status === "ok" ? "✓" : "✗"}
            </span>
          ))}
        </section>

        <section className={classes.profNote}>
          <span className={classes.profNoteAvatar} aria-hidden />
          <div>
            <div className={classes.profNoteTitle}>Prof Z</div>
            <div className={classes.profNoteText}>“{profZNote}”</div>
          </div>
        </section>

        <section className={classes.selectSection}>
          <div className={classes.sectionTitle}>
            ① SELECT — choose your design & methods (click one per row)
          </div>

          <div className={classes.philosophyRow}>
            <div className={classes.philosophyLabel}>
              Philosophy (from Screen 6 — read only)
            </div>
            <div className={classes.philosophyValue}>
              {philosophyParadigm || "Complete Philosophy first"}
            </div>
          </div>

          <div>
            <div className={classes.rowTitle}>Research design</div>
            <div className={classes.designOptions}>
              {METHODOLOGY_DESIGN_OPTIONS.map((option) => {
                const selected = values.meta.design === option.key;
                const flagged =
                  option.key === "yin_case_study" &&
                  primaryWarning &&
                  !values.meta.coherence_overridden;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`${classes.designCard} ${selected ? classes.designCardSelected : ""} ${option.recommended && !selected ? classes.designCardRecommended : ""}`}
                    onClick={() => setMeta({ design: option.key })}
                  >
                    <span className={classes.designCardTitle}>
                      {selected ? "● " : "○ "}
                      {option.title}
                      {option.recommended ? " (recommended)" : ""}
                    </span>
                    <span
                      className={`${classes.designCardHint} ${option.recommended ? classes.designCardHintPrimary : ""}`}
                    >
                      {flagged && selected
                        ? "Currently selected · flagged by Coherence Engine"
                        : option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className={classes.rowTitle}>Data collection</div>
            <div className={classes.pillRow}>
              {METHODOLOGY_COLLECTION_OPTIONS.map((option) => {
                const selected = values.meta.collection?.includes(option.key);
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`${classes.pill} ${selected ? classes.pillSelected : ""}`}
                    onClick={() => toggleCollection(option.key)}
                  >
                    {selected ? "✓ " : ""}
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className={classes.samplingHint}>
              {values.meta.sampling ?? DEFAULT_SAMPLING}
            </div>
          </div>

          <div>
            <div className={classes.rowTitle}>Data analysis</div>
            <div className={classes.pillRow}>
              {METHODOLOGY_ANALYSIS_OPTIONS.map((option) => {
                const selected = values.meta.analysis === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`${classes.pill} ${selected ? classes.pillSelected : ""}`}
                    onClick={() => {
                      setMeta({ analysis: option.key });
                      setValues((current) => {
                        const next = {
                          ...current,
                          meta: { ...current.meta, analysis: option.key },
                        };
                        return {
                          ...next,
                          methodology_paragraph: buildMethodologyParagraph(next),
                        };
                      });
                    }}
                  >
                    {selected ? "✓ " : ""}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className={classes.writeSection}>
          <div className={classes.sectionTitle}>
            ② WRITE — methodology paragraph (goes into your proposal §3)
          </div>
          <div className={classes.writeHeader}>
            <span className={classes.writeTitle}>
              Proposed Methodology & Analysis
            </span>
            <button
              type="button"
              className={classes.askProfZ}
              onClick={askProfZ}
              disabled={isGenerating}
            >
              <span className={classes.profAvatar} aria-hidden />
              Ask Prof Z
            </button>
          </div>
          <RichTextEditorShell
            value={values.methodology_paragraph}
            onChange={(text) =>
              setValues((current) => ({
                ...current,
                methodology_paragraph: text,
              }))
            }
            active={draftFocused}
            minRows={6}
            disabled={isGenerating}
            placeholder="Ask Prof Z to draft from your selections, or write your methodology paragraph"
            hint="✎ Prof Z drafted this from your selections above — click to edit"
            onFocus={() => setDraftFocused(true)}
            onBlur={() => setDraftFocused(false)}
          />
          <div className={classes.writeHint}>
            This text is saved and appears in Review Proposal → §5 Methodology
          </div>
        </section>

        <div className={classes.footer}>
          {saveError ? (
            <Alert color="red" variant="light">
              {saveError}
            </Alert>
          ) : null}
          <Button
            size="compact-sm"
            loading={saving}
            onClick={() => onSave(values)}
          >
            Save methodology
          </Button>
        </div>
      </div>
    </div>
  );
}
