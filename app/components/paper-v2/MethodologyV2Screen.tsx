import useAbly from "#app/components/hooks/useAbly";
import { RichTextEditorShell } from "#app/components/paper-v2/RichTextEditorShell";
import {
  analysisDraftText,
  buildMethodologyParagraph,
  collectionDraftText,
  designDraftText,
  evaluateCoherenceClient,
  type MethodologyV2FormValues,
} from "#app/utils/methodology-v2";
import { Alert, Textarea } from "@mantine/core";
import Ably from "ably";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FormSaveFooter } from "./FormSaveFooter";
import { PlanLimitAlert } from "./PlanLimitAlert";
import classes from "./methodology-v2.module.css";
import { AskProfZButton } from "./AskProfZButton";
import type { LanguageCode } from "#app/utils/languages";

export function MethodologyV2Screen({
  paperId,
  paperLanguage = "en",
  philosophyParadigm,
  initial,
  saving,
  saveError,
  generationError,
  generationPlanLimit,
  onSave,
  onAskProfZ,
  onRecommendDesign,
  recommending,
  recommendationError,
}: {
  paperId: string;
  paperLanguage?: LanguageCode;
  philosophyParadigm?: string | null;
  initial: MethodologyV2FormValues;
  saving?: boolean;
  saveError?: string | null;
  generationError?: string | null;
  generationPlanLimit?: boolean;
  onSave: (values: MethodologyV2FormValues) => void;
  onAskProfZ?: (ablyEvent: string, field: string) => void;
  onRecommendDesign?: () => void;
  recommending?: boolean;
  recommendationError?: string | null;
}) {
  const [values, setValues] = useState<MethodologyV2FormValues>(initial);
  const [showOverride, setShowOverride] = useState(false);
  const [draftFocused, setDraftFocused] = useState(false);
  const [samplingFocused, setSamplingFocused] = useState(false);
  const [designFocused, setDesignFocused] = useState(false);
  const [collectionFocused, setCollectionFocused] = useState(false);
  const [analysisFocused, setAnalysisFocused] = useState(false);
  const [softwareFocused, setSoftwareFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const streamRef = useRef("");
  const ablyEventName = "methodology-paragraph";

  useEffect(() => {
    if (isGenerating) return;
    setValues((current) => ({
      ...initial,
      methodology_paragraph:
        current.methodology_paragraph.trim() && !initial.methodology_paragraph?.trim()
          ? current.methodology_paragraph
          : initial.methodology_paragraph,
    }));
  }, [
    initial.methodology_paragraph,
    initial.meta?.sampling,
    initial.meta?.coherence_overridden,
    initial.meta?.override_reason,
    initial.meta?.recommended_design_label,
    initial.meta?.recommendation_justification,
    initial.meta?.recommended_software,
    initial.meta?.recommended_data_collection,
    initial.meta?.recommended_data_analysis,
    (initial.meta?.recommendation_alternatives ?? [])
      .map((item) => item.design)
      .join("|"),
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
      const nextMeta = {
        ...current.meta,
        ...patch,
        coherence_overridden:
          patch.coherence_overridden !== undefined
            ? patch.coherence_overridden
            : false,
      };
      const nextValues = { ...current, meta: nextMeta };
      const hasDrafts =
        Boolean(designDraftText(nextMeta)) &&
        Boolean(collectionDraftText(nextMeta)) &&
        Boolean(analysisDraftText(nextMeta));
      const shouldDraft = hasDrafts && !current.methodology_paragraph.trim();
      return {
        ...nextValues,
        methodology_paragraph: shouldDraft
          ? buildMethodologyParagraph(nextValues, paperLanguage)
          : current.methodology_paragraph,
      };
    });
  };

  const applySuggestedDesign = () => {
    const suggested = coherence.suggested_design;
    if (!suggested) return;
    setShowOverride(false);
    setMeta({
      recommended_design_label: suggested,
      design: undefined,
    });
  };

  const handleMessage = useCallback((message: Ably.Message) => {
    if (message.data === "[DONE]") {
      const finalParagraph = streamRef.current;
      if (finalParagraph) {
        setValues((current) => ({
          ...current,
          methodology_paragraph: finalParagraph,
        }));
      }
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

  useEffect(() => {
    if (generationError) {
      setIsGenerating(false);
    }
  }, [generationError]);

  const askProfZParagraph = () => {
    if (!onAskProfZ) return;
    streamRef.current = "";
    setValues((current) => ({ ...current, methodology_paragraph: "" }));
    setIsGenerating(true);
    onAskProfZ(ablyEventName, "research_design");
  };

  const profZNote = values.meta.recommendation_justification
    ? values.meta.recommendation_justification
    : "Click Recommend design with Prof Z — one call fills design, sampling, collection, analysis, and software. Then edit and write the paragraph.";

  const designText = designDraftText(values.meta);
  const collectionText = collectionDraftText(values.meta);
  const analysisText = analysisDraftText(values.meta);

  return (
    <div className={classes.shell}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitleWrap}>
          <div className={classes.pageTitle}>Methodology</div>
          <div className={classes.pageSub}>
            One Prof Z recommendation fills design, sampling, collection,
            analysis, and software — then you edit and write the paragraph
          </div>
        </div>
      </div>

      <div className={classes.body}>
        <section className={classes.howItWorks}>
          <div className={classes.howTitle}>How this screen works</div>
          <div className={classes.howText}>
            {`1) Recommend design with Prof Z — fills Research design, Sampling, Data collection, Data analysis, and Software in one go
2) Edit any drafted field if needed
3) Ask Prof Z to WRITE the methodology paragraph, then refine`}
          </div>
          {onRecommendDesign ? (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className={classes.coherenceBtn}
                disabled={recommending}
                onClick={onRecommendDesign}
              >
                {recommending
                  ? "Thinking…"
                  : "Recommend design with Prof Z"}
              </button>
              {recommendationError ? (
                <Alert
                  color="red"
                  mt="sm"
                  classNames={{ message: classes.recommendBody }}
                >
                  {recommendationError}
                </Alert>
              ) : null}
            </div>
          ) : null}
        </section>

        {primaryWarning && !values.meta.coherence_overridden ? (
          <section className={classes.coherenceEngine}>
            <div className={classes.coherenceHeader}>
              <span className={classes.coherenceTitle}>
                ⚠ Drafted design may not match your philosophy
              </span>
              <span className={classes.mismatchBadge}>Review needed</span>
            </div>
            <div className={classes.coherenceMessage}>
              {primaryWarning.message}
            </div>
            <div className={classes.mismatchRow}>
              <span className={classes.mismatchLabel}>Philosophy</span>
              <span className={classes.mismatchValue}>
                {primaryWarning.philosophy ?? philosophyParadigm}
              </span>
              <span>→</span>
              <span className={classes.mismatchLabel}>Design draft</span>
              <span className={classes.mismatchBad}>
                {primaryWarning.selected_design ?? designText}
              </span>
            </div>
            <div className={classes.coherenceActions}>
              <button
                type="button"
                className={classes.coherenceBtn}
                onClick={applySuggestedDesign}
              >
                Use {primaryWarning.suggested_design}
              </button>
              <button
                type="button"
                className={classes.coherenceBtnSecondary}
                onClick={() => setShowOverride((current) => !current)}
              >
                Override & document reason
              </button>
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
                  styles={{
                    input: { fontSize: 10, lineHeight: 1.4 },
                  }}
                />
                <button
                  type="button"
                  className={classes.coherenceBtn}
                  disabled={!values.meta.override_reason?.trim()}
                  onClick={() => setMeta({ coherence_overridden: true })}
                >
                  Confirm override
                </button>
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
                item.status === "ok"
                  ? classes.reportChipOk
                  : classes.reportChipFail
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
            ① Review & edit drafts (filled by Recommend design with Prof Z)
          </div>

          <div className={classes.philosophyRow}>
            <div className={classes.philosophyLabel}>
              Philosophy (from Screen 6 — read only)
            </div>
            <div className={classes.philosophyValue}>
              {philosophyParadigm || "Complete Philosophy first"}
            </div>
          </div>

          {!designText ? (
            <div className={classes.howText} style={{ marginBottom: 8 }}>
              Click “Recommend design with Prof Z” above — one call fills all
              fields below. No separate Ask Prof Z needed on each field.
            </div>
          ) : null}

          <div>
            <div className={classes.rowTitle}>Research design</div>
            <RichTextEditorShell
              value={designText}
              onChange={(text) =>
                setMeta({
                  recommended_design_label: text,
                  design: undefined,
                })
              }
              active={designFocused}
              minRows={2}
              disabled={recommending}
              placeholder="Filled by Recommend design with Prof Z — edit if needed"
              hint="✎ Filled in one go with the other drafts"
              onFocus={() => setDesignFocused(true)}
              onBlur={() => setDesignFocused(false)}
            />
          </div>

          <div>
            <div className={classes.rowTitle}>Sampling</div>
            <RichTextEditorShell
              value={values.meta.sampling ?? ""}
              onChange={(text) => setMeta({ sampling: text })}
              active={samplingFocused}
              minRows={2}
              disabled={recommending}
              placeholder="Filled by Recommend design with Prof Z — edit if needed"
              hint="✎ Filled in one go with the other drafts"
              onFocus={() => setSamplingFocused(true)}
              onBlur={() => setSamplingFocused(false)}
            />
          </div>

          <div>
            <div className={classes.rowTitle}>Data collection</div>
            <RichTextEditorShell
              value={collectionText}
              onChange={(text) =>
                setMeta({
                  recommended_data_collection: text,
                  collection: undefined,
                })
              }
              active={collectionFocused}
              minRows={2}
              disabled={recommending}
              placeholder="Filled by Recommend design with Prof Z — matched to the design"
              hint="✎ Filled in one go with the other drafts"
              onFocus={() => setCollectionFocused(true)}
              onBlur={() => setCollectionFocused(false)}
            />
          </div>

          <div>
            <div className={classes.rowTitle}>Data analysis</div>
            <RichTextEditorShell
              value={analysisText}
              onChange={(text) =>
                setMeta({
                  recommended_data_analysis: text,
                  analysis: undefined,
                })
              }
              active={analysisFocused}
              minRows={2}
              disabled={recommending}
              placeholder="Filled by Recommend design with Prof Z — matched to the design"
              hint="✎ Filled in one go with the other drafts"
              onFocus={() => setAnalysisFocused(true)}
              onBlur={() => setAnalysisFocused(false)}
            />
          </div>

          <div>
            <div className={classes.rowTitle}>
              Analysis software (external tool recommendation)
            </div>
            <RichTextEditorShell
              value={values.meta.recommended_software ?? ""}
              onChange={(text) => setMeta({ recommended_software: text })}
              active={softwareFocused}
              minRows={1}
              disabled={recommending}
              placeholder="Filled by Recommend design with Prof Z — e.g. NVivo, ATLAS.ti"
              hint="✎ External tool until RflowZ in-app analysis is available"
              onFocus={() => setSoftwareFocused(true)}
              onBlur={() => setSoftwareFocused(false)}
            />
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
            <AskProfZButton
              onClick={askProfZParagraph}
              disabled={isGenerating || recommending}
              loading={isGenerating}
            />
          </div>
          <PlanLimitAlert
            message={generationError}
            planLimit={generationPlanLimit}
          />
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
            placeholder="Ask Prof Z to draft continuous prose from the recommendations above"
            hint="✎ Only this paragraph uses Ask Prof Z — drafts above come from Recommend"
            onFocus={() => setDraftFocused(true)}
            onBlur={() => setDraftFocused(false)}
          />
          <div className={classes.writeHint}>
            This text is saved and appears in Review Proposal → §3 Methodology
          </div>
        </section>

        <FormSaveFooter
          type="button"
          loading={saving}
          onClick={() => onSave(values)}
          before={
            saveError ? (
              <Alert color="red" variant="light">
                {saveError}
              </Alert>
            ) : null
          }
        >
          Save methodology
        </FormSaveFooter>
      </div>
    </div>
  );
}
