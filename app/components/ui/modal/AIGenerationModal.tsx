import * as Ably from "ably";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Box, Alert, Button, Modal, Stack, Textarea } from "@mantine/core";
import { useFetcher, useRouteLoaderData } from "@remix-run/react";
import type { loader as rootLoader } from "#app/root";

export const aiGenerationSchema = z.object({
  keywords: z.string().min(1, "Keywords are required"),
  paperId: z.string().optional(),
  language: z.enum(["en", "id", "ar", "ms"]).optional().default("en"),
});

export type AIGenerationFormData = z.infer<typeof aiGenerationSchema>;

type AiActionData = {
  success?: boolean;
  serverError?: string | null;
  lastResult?: {
    error?: Record<string, string[] | null> | null;
    formErrors?: string[];
  };
};

function getErrorMessage(data: AiActionData | undefined): string | null {
  if (!data) return null;

  if (data.serverError) {
    return data.serverError;
  }

  if (data.lastResult?.formErrors?.length) {
    return data.lastResult.formErrors.join(", ");
  }

  if (data.lastResult?.error) {
    const messages = Object.values(data.lastResult.error)
      .flat()
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (data.success === false) {
    return "Failed to generate AI response. Please try again.";
  }

  return null;
}

interface AIGenerationModalProps {
  opened: boolean;
  onClose: () => void;
  onGenerated?: (response: string) => void;
  paperId?: string | null;
  title?: string;
  action: string;
  channelName: string;
  eventName: string;
  language?: string;
}

export const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
  opened,
  onClose,
  onGenerated,
  paperId,
  title = "Generate with AI",
  action,
  channelName,
  eventName,
  language = "en",
}) => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const ablyKey = rootData?.ablyKey;
  const fetcher = useFetcher<AIGenerationFormData>();
  const [aiResponse, setAiResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  useEffect(() => {
    if (!opened) {
      setClientError(null);
      return;
    }

    if (!ablyKey) {
      setClientError(
        "Real-time AI streaming is not configured. Set ABLY_KEY on the web server."
      );
      return;
    }

    const ably = new Ably.Realtime({
      key: ablyKey,
      clientId: paperId ? `rflowz-${paperId}` : "rflowz-new-paper",
    });
    ablyRef.current = ably;

    ably.connection.on("failed", () => {
      setClientError("Could not connect to the AI streaming service. Please try again.");
      setIsGenerating(false);
    });

    const channel = ably.channels.get(channelName);
    channelRef.current = channel;

    channel.subscribe(eventName, (message) => {
      if (message.data === "[DONE]") {
        setIsGenerating(false);
      } else {
        setAiResponse((prev) => prev + message.data);
        setClientError(null);
      }
    });

    return () => {
      channel.unsubscribe();
      ably.close();
      ablyRef.current = null;
      channelRef.current = null;
    };
  }, [opened, ablyKey, channelName, eventName, paperId]);

  useEffect(() => {
    if (
      fetcher.state === "submitting" &&
      fetcher.formData?.get("intent") === "generateAiResponse"
    ) {
      setIsGenerating(true);
      setAiResponse("");
      setClientError(null);
    }
  }, [fetcher.state, fetcher.formData]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }

    const data = fetcher.data as AiActionData;
    const actionError = getErrorMessage(data);

    if (actionError) {
      setClientError(actionError);
      setIsGenerating(false);
      return;
    }

    if (data.success) {
      const timeoutId = window.setTimeout(() => {
        setAiResponse((currentResponse) => {
          if (!currentResponse) {
            setClientError(
              "The AI request was accepted but no response was received. Check ABLY_KEY and try again."
            );
            setIsGenerating(false);
          }
          return currentResponse;
        });
      }, 45000);

      return () => window.clearTimeout(timeoutId);
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (textareaRef.current && !userScrolled) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [aiResponse, userScrolled]);

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: aiGenerationSchema });
    },
    shouldValidate: "onSubmit",
  });

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
      const isScrolledToBottom =
        Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
      setUserScrolled(!isScrolledToBottom);
    }
  };

  const handleInsertResponse = () => {
    if (onGenerated) {
      onGenerated(aiResponse);
      setAiResponse("");
    }
  };

  const actionData = fetcher.data as AiActionData | undefined;
  const errorMessage = clientError || getErrorMessage(actionData);

  return (
    <Modal
      size="xl"
      opened={opened}
      onClose={() => {
        setAiResponse("");
        setClientError(null);
        onClose();
      }}
      title={title}
    >
      <Stack>
        <fetcher.Form method="post" action={action} {...getFormProps(form)}>
          <Stack gap="xs">
            {errorMessage ? (
              <Alert color="red" title="Could not generate">
                {errorMessage}
              </Alert>
            ) : null}
            {paperId && <input type="hidden" name="paperId" value={paperId} />}
            <input type="hidden" name="language" value={language} />
            <input type="hidden" name="intent" value="generateAiResponse" />
            <Textarea
              {...getInputProps(fields.keywords, { type: "text" })}
              error={fields.keywords.errors}
              label="Prompt"
              placeholder="Enter keywords for your AI-generated content"
              description="Enter a prompt to generate a response"
              data-autofocus
            />
            <Box style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                loading={fetcher.state === "submitting" || isGenerating}
                disabled={fetcher.state === "submitting" || isGenerating}
              >
                {fetcher.state === "submitting" || isGenerating
                  ? "Generating..."
                  : "Generate"}
              </Button>
            </Box>
            <Textarea
              autosize
              placeholder="AI response will appear here..."
              value={aiResponse}
              readOnly
              minRows={4}
              maxRows={10}
              ref={textareaRef}
              onScroll={handleScroll}
            />
            {onGenerated ? (
              <Box style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button disabled={!aiResponse} onClick={handleInsertResponse}>
                  Insert response
                </Button>
              </Box>
            ) : null}
          </Stack>
        </fetcher.Form>
      </Stack>
    </Modal>
  );
};
