import {
  chatWizardFinalize,
  chatWizardResearchSearch,
} from "#app/services/chat-wizard.server";
import { requireAuth } from "#app/services/authentication.server";
import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import { APIValidationError } from "#app/utils/error/api-validation-error";
import { redirectWithToast } from "#app/utils/toast.server";
import {
  RESEARCH_TYPE_OPTIONS,
  buildClarifyQuestion,
  buildConfirmLine,
  buildRefinedStatement,
  purposeLabel,
  type ChatMessage,
  type ChatWizardSource,
  type ResearchPurpose,
} from "#app/utils/prof-zz-chat";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { Button, Textarea, Text } from "@mantine/core";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import classes from "./chat.module.css";

type Step =
  | "choose_type"
  | "ask_topic"
  | "collecting"
  | "clarify"
  | "confirm"
  | "finalizing";

const FOCUS_SUGGESTIONS = [
  "the social / lived-experience side",
  "the physical / technical design side",
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth({ request });
  if (!isPaperV2FlowEnabled()) {
    throw redirect("/paper/new/legacy");
  }
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAuth({ request });
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "research-search") {
    const query = String(formData.get("query") ?? "").trim();
    if (query.length < 3) {
      return json({
        intent: "research-search" as const,
        success: false,
        results: [] as ChatWizardSource[],
        message: "Topic too short",
      });
    }

    try {
      const res = await chatWizardResearchSearch({ request, query });
      return json({
        intent: "research-search" as const,
        success: res.data?.success ?? false,
        results: (res.data?.results ?? []) as ChatWizardSource[],
        message: res.data?.message,
      });
    } catch {
      return json({
        intent: "research-search" as const,
        success: false,
        results: [] as ChatWizardSource[],
        message: "Background search failed",
      });
    }
  }

  if (intent === "finalize") {
    const purpose = String(formData.get("purpose") ?? "") as ResearchPurpose;
    const rqCount = Number(formData.get("rq_count") ?? 1);
    const topic = String(formData.get("topic") ?? "").trim();
    const focus = String(formData.get("focus") ?? "").trim();
    const refined = String(formData.get("refined_statement") ?? "").trim();
    let sources: ChatWizardSource[] = [];
    try {
      sources = JSON.parse(String(formData.get("sources") ?? "[]"));
    } catch {
      sources = [];
    }

    try {
      const res = await chatWizardFinalize({
        request,
        payload: {
          purpose,
          rq_count: rqCount,
          topic,
          focus,
          refined_statement: refined || buildRefinedStatement(topic, focus),
          sources,
        },
      });

      const paperId = res.data?.paper?.id;
      if (!paperId) {
        return json({
          intent: "finalize" as const,
          success: false,
          message: "Could not create project",
        });
      }

      return redirectWithToast(`/paper/${paperId}/library`, {
        type: "success",
        title: "Project created",
        description:
          "Introduction drafted from background sources. Review your Library next.",
      });
    } catch (exception: unknown) {
      if (exception instanceof Response) throw exception;
      if (exception instanceof APIValidationError) {
        return json({
          intent: "finalize" as const,
          success: false,
          message:
            exception.data?.message ||
            "You have reached your plan limit. Please upgrade to continue.",
        });
      }
      return json({
        intent: "finalize" as const,
        success: false,
        message: "Could not create project",
      });
    }
  }

  return json({ intent: "unknown" as const, success: false });
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function cleanTypeLabel(label: string) {
  return label.replace(/^\d+\s+/, "").trim();
}

export default function ProfZzChatWizard() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const busy = navigation.state !== "idle";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [step, setStep] = useState<Step>("choose_type");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "hello",
      role: "prof",
      text: "Hello — how can I help you today? What type of research are you planning?",
    },
  ]);
  const [purpose, setPurpose] = useState<ResearchPurpose | null>(null);
  const [rqCount, setRqCount] = useState(1);
  const [topic, setTopic] = useState("");
  const [focus, setFocus] = useState("");
  const [sources, setSources] = useState<ChatWizardSource[]>([]);
  const [draftText, setDraftText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refined = useMemo(
    () => buildRefinedStatement(topic, focus),
    [topic, focus]
  );

  const scrollToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, step, scrollToBottom]);

  useEffect(() => {
    if (step === "ask_topic" || step === "clarify") {
      inputRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (!actionData || actionData.intent !== "research-search") return;
    if (step !== "collecting") return;

    const results = actionData.results ?? [];
    setSources(results);
    const clarify = buildClarifyQuestion(results, topic);
    setMessages((prev) => [
      ...prev.filter((m) => m.role !== "status"),
      { id: uid(), role: "prof", text: clarify },
    ]);
    setStep("clarify");
  }, [actionData, step, topic]);

  useEffect(() => {
    if (!actionData || actionData.intent !== "finalize") return;
    if (actionData.success === false) {
      setError(actionData.message ?? "Finalize failed");
      setStep("confirm");
    }
  }, [actionData]);

  const pushUser = (text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: "user", text }]);
  };

  const pushProf = (text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: "prof", text }]);
  };

  const onSelectType = (id: ResearchPurpose) => {
    const opt = RESEARCH_TYPE_OPTIONS.find((o) => o.id === id);
    if (!opt || step !== "choose_type") return;
    setPurpose(opt.id);
    setRqCount(opt.rqCount);
    pushUser(cleanTypeLabel(opt.label));
    pushProf(
      `A ${purposeLabel(opt.id)} — excellent. Tell me your topic in your own words.`
    );
    setStep("ask_topic");
    setDraftText("");
  };

  const onSubmitTopic = () => {
    const value = draftText.trim();
    if (value.length < 3 || step !== "ask_topic" || busy) return;
    setTopic(value);
    pushUser(value);
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "status",
        text: "Looking up policy, media, and background…",
      },
    ]);
    setStep("collecting");
    setDraftText("");
    const fd = new FormData();
    fd.set("intent", "research-search");
    fd.set("query", value);
    submit(fd, { method: "post" });
  };

  const onSubmitFocus = (valueOverride?: string) => {
    const value = (valueOverride ?? draftText).trim();
    if (value.length < 2 || step !== "clarify" || busy) return;
    setFocus(value);
    pushUser(value);
    const line = buildConfirmLine(topic, value);
    pushProf(line);
    setStep("confirm");
    setDraftText("");
  };

  const onConfirm = () => {
    if (!purpose || step !== "confirm") return;
    setError(null);
    pushUser("Yes — lock this in");
    setStep("finalizing");
    const fd = new FormData();
    fd.set("intent", "finalize");
    fd.set("purpose", purpose);
    fd.set("rq_count", String(rqCount));
    fd.set("topic", topic);
    fd.set("focus", focus);
    fd.set("refined_statement", refined);
    fd.set("sources", JSON.stringify(sources));
    submit(fd, { method: "post" });
  };

  const placeholder =
    step === "ask_topic"
      ? "Describe your topic in your own words…"
      : step === "clarify"
        ? "Reply here, or tap a suggestion above…"
        : step === "confirm"
          ? "Or type a tweak before confirming…"
          : "Message Prof ZZ…";

  const canSend =
    (step === "ask_topic" && draftText.trim().length >= 3) ||
    (step === "clarify" && draftText.trim().length >= 2);

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (step === "ask_topic") onSubmitTopic();
    else if (step === "clarify") onSubmitFocus();
  };

  const composerDisabled =
    busy ||
    step === "collecting" ||
    step === "finalizing" ||
    step === "choose_type";

  return (
    <div className={classes.shell}>
      <div className={classes.frame}>
        <div className={classes.header}>
          <div className={classes.headerAvatar} aria-hidden>
            ZZ
          </div>
          <div>
            <div className={classes.headerTitle}>Prof ZZ</div>
            <div className={classes.headerSub}>
              Research mentor · starts your proposal
            </div>
          </div>
        </div>

        <div className={classes.messages} ref={scrollerRef}>
          {messages.map((m) => {
            if (m.role === "status") {
              return (
                <div key={m.id} className={classes.status}>
                  <span className={classes.typingDots} aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                  {m.text}
                </div>
              );
            }

            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`${classes.row} ${isUser ? classes.rowUser : ""}`}
              >
                <div
                  className={`${classes.avatar} ${
                    isUser ? classes.avatarUser : classes.avatarProf
                  }`}
                  aria-hidden
                >
                  {isUser ? "You" : "ZZ"}
                </div>
                <div className={classes.messageCol}>
                  <div className={classes.roleLabel}>
                    {isUser ? "You" : "Prof ZZ"}
                  </div>
                  <div
                    className={isUser ? classes.bubbleUser : classes.bubbleProf}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}

          {step === "choose_type" ? (
            <div className={classes.suggestions}>
              {RESEARCH_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={classes.suggestion}
                  onClick={() => onSelectType(opt.id)}
                >
                  {cleanTypeLabel(opt.label)}
                </button>
              ))}
            </div>
          ) : null}

          {step === "clarify" ? (
            <div className={classes.suggestions}>
              {FOCUS_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={classes.suggestion}
                  onClick={() => onSubmitFocus(suggestion)}
                  disabled={busy}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className={classes.suggestions}>
              <button
                type="button"
                className={`${classes.suggestion} ${classes.suggestionPrimary}`}
                onClick={onConfirm}
                disabled={busy}
              >
                Confirm ✓ Create project
              </button>
              <button
                type="button"
                className={classes.suggestion}
                onClick={() => {
                  setStep("ask_topic");
                  pushProf(
                    "No problem — tell me the topic again in your own words."
                  );
                  setDraftText("");
                }}
                disabled={busy}
              >
                Change topic
              </button>
            </div>
          ) : null}

          {step === "finalizing" ? (
            <div className={classes.status}>
              <span className={classes.typingDots} aria-hidden>
                <span />
                <span />
                <span />
              </span>
              Creating your project and drafting the Introduction…
            </div>
          ) : null}
        </div>

        <div className={classes.composer}>
          {error ? <div className={classes.error}>{error}</div> : null}

          <div className={classes.composerBox}>
            <Textarea
              ref={inputRef}
              className={classes.composerInput}
              placeholder={placeholder}
              value={draftText}
              onChange={(e) => setDraftText(e.currentTarget.value)}
              onKeyDown={onComposerKeyDown}
              minRows={1}
              maxRows={6}
              autosize
              disabled={composerDisabled}
              variant="unstyled"
              style={{ flex: 1 }}
            />
            <Button
              className={classes.sendBtn}
              size="sm"
              radius="xl"
              onClick={() => {
                if (step === "ask_topic") onSubmitTopic();
                else if (step === "clarify") onSubmitFocus();
              }}
              disabled={!canSend || busy}
            >
              Send
            </Button>
          </div>

          <div className={classes.hintRow}>
            <Text className={classes.hint}>
              Enter to send · Shift+Enter for a new line
            </Text>
            <Button
              component="a"
              href="/home/projects"
              variant="subtle"
              size="compact-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
