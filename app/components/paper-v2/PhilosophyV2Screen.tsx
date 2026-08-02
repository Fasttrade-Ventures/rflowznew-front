import useAbly from "#app/components/hooks/useAbly";
import { RichTextEditorShell } from "#app/components/paper-v2/RichTextEditorShell";
import {
  buildDraftPhilosophy,
  completedDialogueCount,
  mapParadigm,
  PHILOSOPHY_DIALOGUE_STEPS,
  readPhilosophyChoice,
  writePhilosophyChoice,
  type PhilosophyAnswers,
} from "#app/utils/philosophy-dialogue";
import { Button } from "@mantine/core";
import Ably from "ably";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FormSaveFooter } from "./FormSaveFooter";
import { PlanLimitAlert } from "./PlanLimitAlert";
import classes from "./philosophy-v2.module.css";
import { AskProfZButton } from "./AskProfZButton";

function firstIncompleteStep(answers: PhilosophyAnswers): number {
  const index = PHILOSOPHY_DIALOGUE_STEPS.findIndex(
    (step) => !readPhilosophyChoice(answers[`${step.key}_answers`])
  );
  return index === -1 ? PHILOSOPHY_DIALOGUE_STEPS.length - 1 : index;
}

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
  const [data, setData] = useState<PhilosophyAnswers>({
    ontology_answers: initial.ontology_answers ?? null,
    epistemology_answers: initial.epistemology_answers ?? null,
    axiology_answers: initial.axiology_answers ?? null,
    paradigm: initial.paradigm ?? "",
    draft_philosophy: initial.draft_philosophy ?? "",
  });
  const [activeStep, setActiveStep] = useState(() =>
    firstIncompleteStep({
      ontology_answers: initial.ontology_answers ?? null,
      epistemology_answers: initial.epistemology_answers ?? null,
      axiology_answers: initial.axiology_answers ?? null,
      paradigm: initial.paradigm ?? "",
      draft_philosophy: initial.draft_philosophy ?? "",
    })
  );
  const [pendingChoice, setPendingChoice] = useState<"a" | "b" | null>(null);
  const [draftFocused, setDraftFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const streamRef = useRef("");
  const ablyEventName = "philosophy-draft";

  const completedCount = completedDialogueCount(data);
  const currentDialogue = PHILOSOPHY_DIALOGUE_STEPS[activeStep];
  const paradigmInfo = useMemo(() => mapParadigm(data), [data]);

  useEffect(() => {
    setData({
      ontology_answers: initial.ontology_answers ?? null,
      epistemology_answers: initial.epistemology_answers ?? null,
      axiology_answers: initial.axiology_answers ?? null,
      paradigm: initial.paradigm ?? "",
      draft_philosophy: initial.draft_philosophy ?? "",
    });
  }, [
    initial.ontology_answers,
    initial.epistemology_answers,
    initial.axiology_answers,
    initial.paradigm,
    initial.draft_philosophy,
  ]);

  useEffect(() => {
    const existing = readPhilosophyChoice(
      data[`${currentDialogue.key}_answers` as keyof PhilosophyAnswers] as Record<
        string,
        string
      >
    );
    setPendingChoice(existing?.choice ?? null);
  }, [activeStep, currentDialogue.key, data]);

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

  const confirmAnswer = () => {
    if (!pendingChoice) return;
    const option = currentDialogue.options.find((o) => o.key === pendingChoice);
    if (!option) return;

    const field = `${currentDialogue.key}_answers` as keyof PhilosophyAnswers;
    const nextAnswers: PhilosophyAnswers = {
      ...data,
      [field]: writePhilosophyChoice({
        choice: option.key,
        text: option.text,
        summary: option.summary,
      }),
    };
    const mapped = mapParadigm(nextAnswers);
    const withParadigm = {
      ...nextAnswers,
      paradigm: mapped.paradigm,
      draft_philosophy:
        nextAnswers.draft_philosophy.trim() ||
        buildDraftPhilosophy({ ...nextAnswers, paradigm: mapped.paradigm }),
    };

    setData(withParadigm);

    if (activeStep < PHILOSOPHY_DIALOGUE_STEPS.length - 1) {
      setActiveStep((step) => step + 1);
    }
  };

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
          Socratic dialogue — one question at a time · ontology → epistemology →
          axiology · maps to your paradigm
        </div>
      </div>

      <div className={classes.body}>
        <div className={classes.progressRow}>
          <span className={classes.progressLabel}>Dialogue progress</span>
          <span className={classes.progressValue}>
            {completedCount} of {PHILOSOPHY_DIALOGUE_STEPS.length} complete
          </span>
        </div>

        <div className={classes.stepsRow}>
          {PHILOSOPHY_DIALOGUE_STEPS.map((step, index) => {
            const done = Boolean(readPhilosophyChoice(data[`${step.key}_answers`]));
            return (
              <button
                key={step.key}
                type="button"
                className={`${classes.stepPill} ${done ? classes.stepPillDone : ""}`}
                onClick={() => setActiveStep(index)}
              >
                {done ? "✓ " : ""}
                {step.label}
              </button>
            );
          })}
        </div>

        <section className={classes.card}>
          <div className={classes.cardTitle}>Your answers</div>
          <div className={classes.answersGrid}>
            {PHILOSOPHY_DIALOGUE_STEPS.map((step, index) => {
              const choice = readPhilosophyChoice(data[`${step.key}_answers`]);
              const isActive = index === activeStep;
              return (
                <div
                  key={step.key}
                  className={`${classes.answerCard} ${isActive ? classes.answerCardActive : ""}`}
                >
                  {choice ? (
                    <div className={classes.answerText}>{choice.text}</div>
                  ) : (
                    <div className={classes.answerPlaceholder}>
                      Answer the {step.label.toLowerCase()} question below
                    </div>
                  )}
                  <div
                    className={`${classes.answerStep} ${isActive ? classes.answerStepActive : ""}`}
                  >
                    {step.stepLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={classes.questionCard}>
          <div className={classes.questionHeader}>
            Step {activeStep + 1} of {PHILOSOPHY_DIALOGUE_STEPS.length} —{" "}
            {currentDialogue.label}
          </div>
          <div className={classes.questionText}>{currentDialogue.question}</div>
          <div className={classes.options}>
            {currentDialogue.options.map((option) => {
              const selected = pendingChoice === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`${classes.option} ${selected ? classes.optionSelected : ""}`}
                  onClick={() => setPendingChoice(option.key)}
                >
                  <span
                    className={`${classes.radio} ${selected ? classes.radioSelected : ""}`}
                  >
                    {selected ? <span className={classes.radioDot} /> : null}
                  </span>
                  <span className={classes.optionText}>{option.text}</span>
                </button>
              );
            })}
          </div>
          <Button
            size="compact-sm"
            className={classes.confirmBtn}
            disabled={!pendingChoice}
            onClick={confirmAnswer}
          >
            Save answer & map paradigm
          </Button>
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
                disabled={isGenerating || completedCount < 3}
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
            placeholder="Complete all three dialogue steps to auto-draft your philosophy, or use Ask Prof Z"
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
                “{paradigmInfo.profZNote}”
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
