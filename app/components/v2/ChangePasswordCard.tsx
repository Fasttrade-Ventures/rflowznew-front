import type { SubmissionResult } from "@conform-to/react";
import { V2Card } from "#app/components/v2/V2UIKit";
import { useIsPending } from "#app/utils/misc";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Button, PasswordInput, Stack, Text } from "@mantine/core";
import { Form } from "@remix-run/react";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(8, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type ChangePasswordCardProps = {
  actionData?: {
    passwordResult?: SubmissionResult<string[]>;
    passwordServerError?: string | null;
  };
};

export function ChangePasswordCard({ actionData }: ChangePasswordCardProps) {
  const isPending = useIsPending();
  const [form, fields] = useForm({
    id: "change-password-form",
    lastResult: actionData?.passwordResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: changePasswordSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <V2Card title="Security" subtitle="Update your account password">
      <Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="change-password" />
        <Stack gap="xs">
          {actionData?.passwordServerError ? (
            <Text size="xs" c="red">
              {actionData.passwordServerError}
            </Text>
          ) : null}

          <PasswordInput
            label="Current password"
            size="xs"
            {...getInputProps(fields.current_password, { type: "password" })}
            error={fields.current_password.errors?.[0]}
          />
          <PasswordInput
            label="New password"
            size="xs"
            {...getInputProps(fields.password, { type: "password" })}
            error={fields.password.errors?.[0]}
          />
          <PasswordInput
            label="Confirm new password"
            size="xs"
            {...getInputProps(fields.password_confirmation, {
              type: "password",
            })}
            error={fields.password_confirmation.errors?.[0]}
          />

          <Button type="submit" size="xs" disabled={isPending} mt={4}>
            Update password
          </Button>
        </Stack>
      </Form>
    </V2Card>
  );
}

export { changePasswordSchema };
