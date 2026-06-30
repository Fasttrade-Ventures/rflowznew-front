import React, { useState, useCallback, useEffect, useRef } from "react";
import { Textarea, Stack } from "@mantine/core";
import Ably from "ably";
import LabelWithActions from "../LabelWithActions";
import useAbly from "#app/components/hooks/useAbly";
import { useFetcher } from "@remix-run/react";
import classes from "./AITextArea.module.css";
import { CitationBar } from "../citation/CitationBar";
import { ExtendedCitation } from "#app/services/paper.server";

interface AITextAreaProps
  extends React.ComponentPropsWithoutRef<typeof Textarea> {
  label: string;
  infoContent: string;
  initialValue: string;
  paperId: string | undefined;
  field: string;
  fieldId: string;
  onValueChange: (value: string) => void;
  errors?: string[];
  generateUrl: string;
  ablyEventName: string;
  aiIntentName: string;
  hiddenInputsForAIGeneration?: { name: string; value: string }[];
  citations?: {
    onAddCitationClick: () => void;
    citationData: ExtendedCitation[] | undefined;
  };
}

export const AITextArea: React.FC<AITextAreaProps> = ({
  label,
  infoContent,
  initialValue,
  paperId,
  field,
  fieldId,
  onValueChange,
  errors,
  generateUrl,
  ablyEventName,
  aiIntentName,
  hiddenInputsForAIGeneration,
  citations,
  ...textareaProps
}) => {
  const [value, setValue] = useState(initialValue || ""); // Ensure initial value is never undefined
  const [isGenerating, setIsGenerating] = useState(false);
  const isAIGeneratedRef = useRef(false);

  const handleMessage = useCallback((message: Ably.Message) => {
    if (message.data === "[DONE]") {
      setIsGenerating(false);
      isAIGeneratedRef.current = true;
    } else {
      setValue((prev) => prev + message.data);
    }
  }, []);

  useAbly(paperId, ablyEventName, handleMessage);

  const fetcher = useFetcher<any>();

  const handleAIClick = useCallback(() => {
    setIsGenerating(true);
    const submitData: Record<string, string> = {
      intent: aiIntentName,
      paperId: paperId || "",
      ablyEventName: ablyEventName,
    };
    if (hiddenInputsForAIGeneration) {
      hiddenInputsForAIGeneration.forEach((input) => {
        submitData[input.name] = input.value;
      });
    }

    fetcher.submit(submitData, { method: "post", action: generateUrl });
  }, [
    generateUrl,
    paperId,
    ablyEventName,
    aiIntentName,
    hiddenInputsForAIGeneration,
  ]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setValue(newValue);
    onValueChange(newValue);
  };

  useEffect(() => {
    if (initialValue !== undefined && value !== initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (isAIGeneratedRef.current) {
      onValueChange(value);
      isAIGeneratedRef.current = false;
    }
  }, [value, onValueChange]);

  useEffect(() => {
    if (fetcher.data?.serverError) {
      setIsGenerating(false);
    }
  }, [fetcher.data]);

  return (
    <Stack gap="xs">
      <LabelWithActions
        label={label}
        htmlFor={fieldId}
        infoContent={infoContent}
        onAIClick={handleAIClick}
        errorGeneratingAI={fetcher.data?.success === false}
        isGenerating={isGenerating}
      />
      {citations?.onAddCitationClick &&
        typeof citations.onAddCitationClick === "function" && (
          <CitationBar
            citations={{
              onAddCitationClick: citations.onAddCitationClick,
              citationData: citations.citationData,
            }}
          />
        )}
      <Textarea
        classNames={{
          input: classes.textarea,
        }}
        size="md"
        value={value}
        onChange={handleChange}
        error={errors?.join(", ")}
        minRows={4}
        autosize
        placeholder={
          fetcher.state === "submitting" || fetcher.state === "loading"
            ? "Generating..."
            : fetcher.data?.success === false
            ? fetcher.data?.serverError
            : "Start typing..."
        }
        disabled={isGenerating}
        {...textareaProps}
      />
    </Stack>
  );
};
