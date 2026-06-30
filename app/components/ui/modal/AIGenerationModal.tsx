import * as Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Box, Button, Modal, Stack, Textarea } from "@mantine/core";
import { useFetcher } from "@remix-run/react";

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
  const fetcher = useFetcher<AIGenerationFormData>();
  const [aiResponse, setAiResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  const setupAbly = useCallback(() => {
    if (
      fetcher.state === "submitting" &&
      fetcher.formData?.get("intent") === "generateAiResponse"
    ) {
      setIsGenerating(true);
      setAiResponse("");

      if (!ablyRef.current) {
        ablyRef.current = new Ably.Realtime({
          key: "zNWqfQ.szAlPQ:PX_iFFsAaHiCwSXm_chtrHbpPtOP93QTUNslOb1puHw",
          clientId: "your-client-id",
        });

        ablyRef.current.connection.once("connected", () => {
          channelRef.current = ablyRef.current!.channels.get(channelName);

          channelRef.current.subscribe(eventName, (message) => {
            console.log("message TITLE AIII 🔥🔥🔥🔥", message);
            if (message.data === "[DONE]") {
              setIsGenerating(false);
            } else {
              setAiResponse((prev) => prev + message.data);
            }
          });
        });
      }
    }
  }, [fetcher.state, fetcher.formData, channelName, onGenerated]);

  useEffect(() => {
    setupAbly();
  }, [setupAbly]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (ablyRef.current) {
        ablyRef.current.close();
        ablyRef.current = null;
      }
    };
  }, []);

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
      setAiResponse(""); // Clear the AI response
    }
  };

  return (
    <Modal
      size="xl"
      opened={opened}
      onClose={() => {
        setAiResponse(""); // Clear the AI response when closing the modal
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
                loading={fetcher.state === "submitting"}
                disabled={fetcher.state === "submitting"}
              >
                {fetcher.state === "submitting" ? "Generating..." : "Generate"}
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
                <Button
                  disabled={!aiResponse}
                  onClick={handleInsertResponse} // Use the new handler
                >
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
