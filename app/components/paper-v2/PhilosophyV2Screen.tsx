import useAbly from "#app/components/hooks/useAbly";
import { RichTextEditorShell } from "#app/components/paper-v2/RichTextEditorShell";
import {
  buildQualitativePreset,
  completedDialogueCount,
  mapParadigm,
  PHILOSOPHY_DIALOGUE_STEPS,
  readPhilosophyChoice,
  type PhilosophyAnswers,
} from "#app/utils/philosophy-dialogue";
import Ably from "ably";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FormSaveFooter } from "./FormSaveFooter";
import { PlanLimitAlert } from "./PlanLimitAlert";
import classes from "./philosophy-v2.module.css";
import { AskProfZButton } from "./AskProfZButton";

export function PhilosophyV2Screen({
  paperId,
  initial,
  saving,
  savedDraft,
  generationError,
  generationPlanLimit,
  onSave,
  onAskProfZ,
}: {
  paperId: string;
  initial: Partial<PhilosophyAnswers>;
  saving?: boolean;
  savedDraft?: boolean;
  generationError?: string | null;
  generationPlanLimit?: boolean;
  onSave: (data: PhilosophyAnswers) => void;
  onAskProfZ?: (step: string, ablyEvent: string) => void;
}) {
  const hasNoAnswers =
    !initial.ontology_answers &&
    !initial.epistemology_answers &&
    !initial.axiology_answers;

  const [data, setData] = useState<PhilosophyAnswers>(() =>
    hasNoAnswers
      ? buildQualitativePreset(initial.draft_philosophy ?? "")
      : {
          ontology_answers: initial.ontology_answers ?? null,
          epistemology_answers: initial.epistemology_answers ?? null,
          axiology_answers: initial.axiology_answers ?? null,
          paradigm: initial.paradigm ?? "",
          draft_philosophy: initial.draft_philosophy ?? "",
        }
  );

  const [draftFocused, setDraftFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const streamRef = useRef("");
  const ablyEventName = "philosophy-draft";

  const completedCount = completedDialogueCount(data);
  const paradigmInfo = useMemo(() => mapParadigm(data), [data]);

  useEffect(() => {
    const noAnswers =
      !initial.ontology_answers &&
      !initial.epistemology_answers &&
      !initial.axiology_answers;
    setData(
      noAnswers
        ? buildQualitativePreset(initial.draft_philosophy ?? "")
        : {
            ontology_answers: initial.ontology_answers ?? null,
            epistemology_answers: initial.epistemology_answers ?? null,
            axiology_answers: initial.axiology_answers ?? null,
            paradigm: initial.paradigm ?? "",
            draft_philosophy: initial.draft_philosophy ?? "",
          }
    );
  }, [
    initial.ontology_answers,
    initial.epistemology_answers,
    initial.axiology_answers,
    initial.paradigm,
    initial.draft_philosophy,
  ]);

  const handleMessage = useCallback((message: Ably.Message) => {
    if (message.data === "[DONE]") {
      setIsGenerating(false);
      streamRef.current = "";
      return;
    }
    streamRef.current += String(message.data);
    setData((current) => ({
      ...current,
      draft_philosophy: streamRef.current,
    }));
  }, []);

  useAbly(paperId, ablyEventName, handleMessage);

  useEffect(() => {
    if (generationError) {
      setIsGenerating(false);
    }
  }, [generationError]);

  const askProfZ = () => {
    if (!onAskProfZ) return;
    streamRef.current = "";
    setIsGenerating(true);
    onAskProfZ("draft", ablyEventName);
  };

  return (
    <div className={classes.shell}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitle}>Philosophy</div>
        <div className={classes.pageSub}>
          Qualitative research · Interpretivism · Constructivism
        </div>
      </div>

      <div className={classes.body}>
        <section className={classes.card}>
          <div className={classes.cardTitle}>Your answers</div>
          <div className={classes.answersGrid}>
            {PHILOSOPHY_DIALOGUE_STEPS.map((step) => {
              const choice = readPhilosophyChoice(data[`${step.key}_answers`]);
              return (
                <div key={step.key} className={classes.answerCard}>
                  {choice ? (
                    <div className={classes.answerText}>{choice.text}</div>
                  ) : (
                    <div className={classes.answerPlaceholder}>
                      Not set
                    </div>
                  )}
                  <div className={classes.answerStep}>{step.stepLabel}</div>
                </div>
              );
            })}
          </div>
        </section>

        {completedCount > 0 ? (
          <section className={classes.paradigmBar}>
            <span className={classes.paradigmLabel}>Mapped paradigm:</span>
            {data.paradigm.split("·").map((part) => (
              <span key={part.trim()} className={classes.paradigmBadge}>
                {part.trim()}
              </span>
            ))}
            {paradigmInfo.summaryLine ? (
              <span className={classes.paradigmSummary}>
                {paradigmInfo.summaryLine}
              </span>
            ) : null}
          </section>
        ) : null}

        <section className={classes.draftCard}>
          <div className={classes.draftHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={classes.draftTitle}>Research Philosophy (draft)</span>
              {savedDraft && data.draft_philosophy.trim() ? (
                <span className={classes.savedBadge}>Saved</span>
              ) : null}
            </div>
            {onAskProfZ ? (
              <AskProfZButton
                onClick={askProfZ}
                disabled={isGenerating}
                loading={isGenerating}
              />
            ) : null}
          </div>
          <PlanLimitAlert
            message={generationError}
            planLimit={generationPlanLimit}
          />
          <RichTextEditorShell
            value={data.draft_philosophy}
            onChange={(value) =>
              setData((current) => ({ ...current, draft_philosophy: value }))
            }
            active={draftFocused}
            minRows={6}
            disabled={isGenerating}
            placeholder="Use Ask Prof Z to generate your philosophy draft"
            hint="✎ Click to edit"
            onFocus={() => setDraftFocused(true)}
            onBlur={() => setDraftFocused(false)}
          />
        </section>

        {completedCount >= 3 ? (
          <section className={classes.profNote}>
            <span className={classes.profNoteAvatar} aria-hidden />
            <div>
              <div className={classes.profNoteTitle}>Prof Z</div>
              <div className={classes.profNoteText}>
                "{paradigmInfo.profZNote}"
              </div>
            </div>
          </section>
        ) : null}

        <FormSaveFooter
          type="button"
          loading={saving}
          onClick={() => onSave(data)}
        >
          Save philosophy
        </FormSaveFooter>
      </div>
    </div>
  );
}
