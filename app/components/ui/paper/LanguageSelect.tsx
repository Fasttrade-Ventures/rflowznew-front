import React from "react";
import { NativeSelect } from "@mantine/core";
import { getInputProps, FieldMetadata } from "@conform-to/react";

// Language selection options
const LANGUAGE_OPTIONS = [
  { value: "en", label: "🇺🇸 English" },
  { value: "ms", label: "🇲🇾 Malay" },
  { value: "ar", label: "🇸🇦 Arabic" },
  { value: "id", label: "🇮🇩 Indonesian" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["value"];

interface LanguageSelectProps {
  field: FieldMetadata<LanguageCode>;
  isEditing?: boolean;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({
  field,
  isEditing = false,
}) => {
  return (
    <NativeSelect
      label="Language"
      description="Select the language for AI-generated content"
      data={LANGUAGE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      disabled={isEditing}
      error={field.errors}
      {...getInputProps(field, { type: "text" })}
      aria-label="Select language for AI-generated content"
      aria-describedby={field.errors ? field.errorId : undefined}
    />
  );
};

export default LanguageSelect;
