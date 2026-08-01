import * as Ably from "ably";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Box, Button, Modal, Stack, Text, Textarea } from "@mantine/core";
import { useFetcher, useRouteLoaderData } from "@remix-run/react";
import type { loader as rootLoader } from "#app/root";

export const aiGenerationSchema = z.object({
  keywords: z.string().min(1, "Keywords are required"),
  paperId: z.string().optional(),
  language: z.enum(["en", "id", "ar", "ms"]).optional().default("en"),
});

export type AIGenerationFormData = z.infer<typeof aiGenerationSchema>;

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
  const [userScrolled, setUserScrolled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  useEffect(() => {
    if (!opened || !ablyKey) return;

    const ably = new Ably.Realtime({
      key: ablyKey,
      clientId: paperId ? `rflowz-${paperId}` : "rflowz-new-paper",
    });
    ablyRef.current = ably;

    const channel = ably.channels.get(channelName);
    channelRef.current = channel;

    channel.subscribe(eventName, (message) => {
      if (message.data === "[DONE]") {
        setIsGenerating(false);
      } else {
        setAiResponse((prev) => prev + message.data);
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
    }
  }, [fetcher.state, fetcher.formData]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const data = fetcher.data as { success?: boolean; serverError?: string };
      if (data.success === false) {
        setIsGenerating(false);
      }
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

  return (
    <Modal
      size="xl"
      opened={opened}
      onClose={() => {
        setAiResponse("");
        onClose();
      }}
      title={title}
    >
      <Stack>
        <fetcher.Form method="post" action={action} {...getFormProps(form)}>
          <Stack gap="xs">
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
            {(fetcher.data as { serverError?: string } | undefined)
              ?.serverError ? (
              <Text c="red" size="sm">
                {(fetcher.data as { serverError?: string }).serverError}
              </Text>
            ) : null}
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
