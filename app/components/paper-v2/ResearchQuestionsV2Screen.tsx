import type { ResearchQuestionAndObjectiveActionData } from "#app/routes/paper+/$paperId+/research-questions-and-objectives+/form";
import useAbly from "#app/components/hooks/useAbly";
import {
  ablyEventForSlot,
  engineMapLabel,
  getSubIdForSlot,
  readRqFromSlot,
  effectiveRqCount,
  rqPageSubtitle,
  rqSlotsForCount,
  writeRqToSlot,
  type PaperSimulationMeta,
  type RqFormValues,
  type RqSlotConfig,
} from "#app/utils/research-questions-v2";
import { Alert, Textarea } from "@mantine/core";
import { showAskProfZNotification } from "#app/utils/api-error";
import { useFetcher, useRevalidator } from "@remix-run/react";
import { notifications } from "@mantine/notifications";
import Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpinDelay } from "spin-delay";

import { FormSaveFooter } from "./FormSaveFooter";
import { V2ReadContent } from "./V2ReadContent";
import classes from "./research-questions-v2.module.css";
import { AskProfZButton } from "./AskProfZButton";
import { PlanLimitAlert } from "./PlanLimitAlert";

function RqCard({
  slot,
  paperId,
  formUrl,
  value,
  edited,
  active,
  subResearchQuestionId,
  onFocus,
  onChange,
  errors,
}: {
  slot: RqSlotConfig;
  paperId: string;
  formUrl: string;
  value: string;
  edited: boolean;
  active: boolean;
  subResearchQuestionId?: number | null;
  onFocus: () => void;
  onChange: (value: string) => void;
  errors?: string[];
}) {
  const aiFetcher = useFetcher<ResearchQuestionAndObjectiveActionData>();
  const [isGenerating, setIsGenerating] = useState(false);
  const streamRef = useRef("");
  const ablyEventName = ablyEventForSlot(slot.slot);

  const handleMessage = useCallback(
    (message: Ably.Message) => {
      if (message.data === "[DONE]") {
        setIsGenerating(false);
        streamRef.current = "";
        return;
      }
      streamRef.current += String(message.data);
      onChange(streamRef.current);
    },
    [onChange]
  );

  useAbly(paperId, ablyEventName, handleMessage);

  const aiError =
    aiFetcher.data &&
    "serverError" in aiFetcher.data &&
    typeof aiFetcher.data.serverError === "string"
      ? aiFetcher.data.serverError
      : null;
  const aiPlanLimit =
    aiFetcher.data &&
    "planLimit" in aiFetcher.data &&
    Boolean(aiFetcher.data.planLimit);

  useEffect(() => {
    if (aiError) {
      setIsGenerating(false);
      showAskProfZNotification({
        message: aiError,
        planLimit: aiPlanLimit,
        title:
          aiFetcher.data &&
          "toast" in aiFetcher.data &&
          aiFetcher.data.toast &&
          typeof aiFetcher.data.toast.title === "string"
            ? aiFetcher.data.toast.title
            : undefined,
      });
    }
  }, [aiError, aiPlanLimit, aiFetcher.data]);

  const askProfZ = () => {
    streamRef.current = "";
    onChange("");
    setIsGenerating(true);
    onFocus();

    if (slot.slot === 1) {
      aiFetcher.submit(
        {
          intent: "gen_ai_main_research_question",
          paperId,
          ablyEventName,
        },
        { method: "post", action: formUrl }
      );
      return;
    }

    if (!subResearchQuestionId) {
      setIsGenerating(false);
      return;
    }

    aiFetcher.submit(
      {
        intent: "gen_ai_sub_research_question",
        paperId,
        ablyEventName,
        subResearchQuestionId: String(subResearchQuestionId),
        subResearchOrder: slot.slot === 3 ? "3" : String(slot.slot - 1),
        field: "question",
      },
      { method: "post", action: formUrl }
    );
  };

  return (
    <section
      className={`${classes.rqCard} ${active ? classes.rqCardActive : ""}`}
    >
      <div className={classes.rqHeader}>
        <div className={classes.rqLeft}>
          <span className={classes.rqNumber}>RQ{slot.slot}</span>
          <div className={classes.badges}>
            <span className={classes.typeBadge}>{slot.typeLabel}</span>
            <span className={classes.arrow}>→</span>
            <span className={classes.engineBadge}>{slot.engineLabel}</span>
            {edited && value.trim() ? (
              <span className={classes.editedBadge}>Edited</span>
            ) : null}
          </div>
        </div>
        <AskProfZButton
          onClick={askProfZ}
          disabled={isGenerating || aiFetcher.state !== "idle"}
          loading={isGenerating || aiFetcher.state !== "idle"}
        />
      </div>

      <PlanLimitAlert message={aiError} planLimit={aiPlanLimit} />

      <div
        className={`${classes.editorShell} ${active ? classes.editorShellActive : ""}`}
      >
        <div className={classes.editorToolbar}>
          <span className={classes.toolbarStrong}>B</span>
          <span className={classes.toolbarItalic}>I</span>
          <span>U</span>
          <span>·</span>
          <span className={classes.toolbarLink}>Link</span>
          <span className={classes.toolbarHint}>Rich text</span>
        </div>
        <div
          className={`${classes.editorBody} ${active ? classes.editorBodyActive : ""}`}
        >
          <Textarea
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            onFocus={onFocus}
            minRows={4}
            autosize
            disabled={isGenerating}
            placeholder="Broad research question — click to edit or use Ask Prof Z"
            error={errors}
          />
          <span className={classes.editHint}>
            {edited && value.trim() ? slot.editHint : "✎ Click to edit"}
          </span>
        </div>
      </div>
    </section>
  );
}

export function ResearchQuestionsV2Screen({
  paperId,
  formUrl,
  actionData,
  meta,
  initialValues,
  initialEditedSlots = [],
}: {
  paperId: string;
  formUrl: string;
  actionData?: ResearchQuestionAndObjectiveActionData;
  meta?: PaperSimulationMeta | null;
  initialValues: RqFormValues;
  initialEditedSlots?: number[];
}) {
  const fetcher = useFetcher<ResearchQuestionAndObjectiveActionData>();
  const revalidator = useRevalidator();
  const rqCount = effectiveRqCount(meta);
  const slots = rqSlotsForCount(rqCount);

  const [values, setValues] = useState(initialValues);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [editedSlots, setEditedSlots] = useState<Set<number>>(
    () => new Set(initialEditedSlots)
  );

  useEffect(() => {
    setValues(initialValues);
  }, [
    initialValues.main,
    initialValues.subs.map((sub) => `${sub.id}:${sub.question}`).join("|"),
  ]);

  const setSlotValue = (slotNumber: number, text: string) => {
    setValues((current) => writeRqToSlot(current, slotNumber, text));
    if (text.trim()) {
      setEditedSlots((current) => new Set(current).add(slotNumber));
    }
  };

  const isPending = fetcher.state !== "idle";
  const isDelayedPending = useSpinDelay(isPending, {
    delay: 200,
    minDuration: 500,
  });

  useEffect(() => {
    const data = fetcher.data;
    if (!data || fetcher.state !== "idle") return;

    if (data.success && data.toast) {
      notifications.show({
        title: data.toast.title,
        message: data.toast.description,
        color: "teal",
      });
      revalidator.revalidate();
    }
  }, [fetcher.data, fetcher.state, revalidator]);

  return (
    <div className={classes.shell}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitle}>Research questions</div>
        <div className={classes.pageSub}>{rqPageSubtitle(rqCount)}</div>
      </div>

      <fetcher.Form method="post" action={formUrl} className={classes.body}>
        <input type="hidden" name="paperId" value={paperId} />
        <input type="hidden" name="intent" value="save_all_v2" />
        <input type="hidden" name="main_research_question" value={values.main} />

        {values.subs.map((sub) => (
          <span key={sub.id}>
            <input
              type="hidden"
              name={`sub_id_${sub.order + 1}`}
              value={sub.id}
            />
            <input
              type="hidden"
              name={`sub_question_${sub.id}`}
              value={sub.question}
            />
          </span>
        ))}

        {actionData?.serverError ? (
          <Alert color="red" variant="light">
            {actionData.serverError}
          </Alert>
        ) : null}

        {slots.map((slot) => (
          <RqCard
            key={slot.slot}
            slot={slot}
            paperId={paperId}
            formUrl={formUrl}
            value={readRqFromSlot(values, slot.slot)}
            edited={editedSlots.has(slot.slot)}
            active={activeSlot === slot.slot}
            subResearchQuestionId={getSubIdForSlot(values, slot.slot)}
            onFocus={() => setActiveSlot(slot.slot)}
            onChange={(text) => setSlotValue(slot.slot, text)}
            errors={
              slot.slot === 1 && actionData?.serverError
                ? [actionData.serverError]
                : undefined
            }
          />
        ))}

        <div className={classes.engineMap}>
          <span className={classes.engineMapLabel}>Engine map:</span>
          {slots.map((slot) => (
            <span key={slot.slot} className={classes.engineMapChip}>
              {engineMapLabel(slot)}
            </span>
          ))}
        </div>

        <div className={classes.profNote}>
          <span className={classes.profNoteAvatar} aria-hidden />
          <div>
            <div className={classes.profNoteTitle}>Prof Z</div>
            <div className={classes.profNoteText}>
              “These are research questions — broad inquiries. The interview
              questions live beneath RQ2, later.”
            </div>
          </div>
        </div>

        <FormSaveFooter loading={isDelayedPending}>
          Save research questions
        </FormSaveFooter>
      </fetcher.Form>
    </div>
  );
}

export function ResearchQuestionsV2Read({
  meta,
  values,
}: {
  meta?: PaperSimulationMeta | null;
  values: RqFormValues;
}) {
  const rqCount = effectiveRqCount(meta);
  const slots = rqSlotsForCount(rqCount);

  return (
    <div className={classes.shell}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitle}>Research questions</div>
        <div className={classes.pageSub}>{rqPageSubtitle(slots.length)}</div>
      </div>
      <div className={classes.body}>
        {slots.map((slot) => (
          <section key={slot.slot} className={classes.rqCard}>
            <div className={classes.rqHeader}>
              <div className={classes.rqLeft}>
                <span className={classes.rqNumber}>RQ{slot.slot}</span>
                <div className={classes.badges}>
                  <span className={classes.typeBadge}>{slot.typeLabel}</span>
                  <span className={classes.arrow}>→</span>
                  <span className={classes.engineBadge}>{slot.engineLabel}</span>
                </div>
              </div>
            </div>
            <V2ReadContent content={readRqFromSlot(values, slot.slot)} />
          </section>
        ))}
        <div className={classes.engineMap}>
          <span className={classes.engineMapLabel}>Engine map:</span>
          {slots.map((slot) => (
            <span key={slot.slot} className={classes.engineMapChip}>
              {engineMapLabel(slot)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
