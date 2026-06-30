import { ProblemStatementActionData } from "#app/routes/paper+/$paperId+/problem-statement+/form";
import { useEffect, useState } from "react";
import { useSpinDelay } from "spin-delay";
import { z } from "zod";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import {
  Alert,
  Badge,
  Button,
  CopyButton,
  Group,
  Stack,
  Transition,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useFetcher } from "@remix-run/react";

import { AITextArea } from "../ai/AITextArea";
import classes from "./FormSection.module.css";
import { ExtendedCitation } from "#app/services/paper.server";
import { Icon } from "#app/components/icon";

interface FormSectionProps<T extends z.ZodType<any, any>> {
  formId?: string;
  section: {
    label: string;
    field: keyof z.infer<T>;
    initialValue: string;
    infoContent: string;
  };
  paperId: string | undefined;
  actionData: any;
  schema: T;
  generateUrl: string; // New prop for generateUrl
  ablyEventName: string;
  aiIntentName: string;
  saveIntentName?: string;
  onTextAreaChange?: (value: string) => void;
  hiddenInputsForAIGeneration?: {
    name: string;
    value: string;
  }[];
  hiddenInputsForSave?: {
    name: string;
    value: string;
  }[];
  citations?: {
    onAddCitationClick: () => void;
    citationData?: ExtendedCitation[] | undefined;
  };
}

export function FormSection<T extends z.ZodType<any, any>>({
  section,
  formId = String(section.field),
  ablyEventName,
  aiIntentName,
  saveIntentName,
  paperId,
  actionData,
  schema,
  generateUrl,
  onTextAreaChange,
  hiddenInputsForAIGeneration,
  hiddenInputsForSave,
  citations,
}: FormSectionProps<T>) {
  const fetcher = useFetcher<ProblemStatementActionData>();
  const [form, fields] = useForm({
    id: formId,
    lastResult: actionData?.lastResult || fetcher.data?.lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    defaultValue: {
      [section.field]: section.initialValue,
    } as z.infer<T>,
  });

  const isPending = fetcher.state !== "idle";
  const isDelayedPending = useSpinDelay(isPending, {
    delay: 200,
    minDuration: 500,
  });

  useEffect(() => {
    if (fetcher.data?.toast) {
      setLocalDirty(false);
      notifications.show({
        title: fetcher.data.toast.title,
        message: fetcher.data.toast.description,
      });
    }
  }, [fetcher.data]);

  const [localDirty, setLocalDirty] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState(section.initialValue);

  const handleCopy = () => {
    navigator.clipboard.writeText(textAreaValue);
    notifications.show({
      title: "Copied",
      message: "Text has been copied to clipboard",
    });
  };

  const handleClear = () => {
    setTextAreaValue("");
    setLocalDirty(true);
    onTextAreaChange?.("");
  };

  const inputProps = getInputProps(fields[String(section.field)], {
    type: "text",
  });
  const { defaultValue, ...restInputProps } = inputProps;

  return (
    <div className={classes.container}>
      <fetcher.Form method="post" action={generateUrl} {...getFormProps(form)}>
        <Stack>
          {form.errors && form.errors.length > 0 && (
            <Alert color="red" mb="md">
              <ul>
                {form.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          <input type="hidden" name="paperId" value={paperId} />
          <AITextArea
            aiIntentName={aiIntentName}
            label={section.label}
            infoContent={section.infoContent}
            initialValue={textAreaValue}
            paperId={paperId}
            field={String(section.field)}
            fieldId={fields[String(section.field)].id}
            onValueChange={(value) => {
              setTextAreaValue(value);
              setLocalDirty(true);
              onTextAreaChange?.(value);
            }}
            errors={fields[String(section.field)].errors}
            generateUrl={generateUrl}
            ablyEventName={ablyEventName}
            hiddenInputsForAIGeneration={hiddenInputsForAIGeneration}
            citations={
              citations
                ? {
                    onAddCitationClick: citations.onAddCitationClick,
                    citationData: citations.citationData || undefined,
                  }
                : undefined
            }
            {...restInputProps}
          />
          {hiddenInputsForSave &&
            hiddenInputsForSave.map((input, index) => (
              <input
                type="hidden"
                name={input.name}
                value={input.value}
                key={index}
              />
            ))}
          <Group justify="space-between">
            <Group gap={4}>
              <CopyButton value={textAreaValue}>
                {({ copied, copy }) => (
                  <Button
                    color={copied ? "teal" : "dark.4"}
                    variant="subtle"
                    onClick={copy}
                    leftSection={
                      <Icon
                        name={copied ? "pika-copied" : "pika-copy"}
                        style={
                          copied
                            ? { width: 20, height: 20 }
                            : { width: 16, height: 16 }
                        }
                      />
                    }
                    size="xs"
                    disabled={!textAreaValue.trim()}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </CopyButton>
              <Button
                variant="subtle"
                color="dark.4"
                leftSection={
                  <Icon name="pika-eraser" style={{ width: 22, height: 22 }} />
                }
                size="xs"
                onClick={handleClear}
                disabled={!textAreaValue.trim()}
              >
                Clear
              </Button>
            </Group>

            <SaveButton
              field={String(section.field)}
              isDirty={localDirty}
              saveIntentName={saveIntentName}
              isDelayedPending={isDelayedPending}
            />
          </Group>
        </Stack>
      </fetcher.Form>
    </div>
  );
}

interface SaveButtonProps {
  field: string;
  isDirty: boolean;
  saveIntentName?: string;
  isDelayedPending: boolean;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  field,
  isDirty,
  saveIntentName = `save_${field}`,
  isDelayedPending,
}) => {
  return (
    <Group className={classes.saveButton}>
      <Transition
        mounted={isDirty}
        transition="fade-right"
        duration={400}
        timingFunction="ease"
      >
        {(styles) => (
          <Badge
            size="md"
            variant="gradient"
            gradient={{ from: "yellow.9", to: "yellow.6", deg: 90 }}
            style={styles}
            c="black"
          >
            Unsaved changes
          </Badge>
        )}
      </Transition>

      <Button
        loading={isDelayedPending}
        type="submit"
        name="intent"
        value={saveIntentName}
        disabled={isDelayedPending || !isDirty}
      >
        Save
      </Button>
    </Group>
  );
};
