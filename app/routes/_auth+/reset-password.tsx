import { Alert, Button, PasswordInput, Stack, Title } from "@mantine/core";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { z } from "zod";

import { useIsPending } from "#app/utils/misc";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import {
  requireGuest,
  resetPassword,
} from "#app/services/authentication.server";
import { AuthorizationError } from "remix-auth";
import classes from "./authPage.module.css";
import { redirectWithToast } from "#app/utils/toast.server";

const schema = z.object({
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
  token: z.string(),
  email: z.string().email(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireGuest({ request });

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  console.log("submission :>> ", submission);

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply(), serverError: null });
  }

  try {
    await resetPassword({
      password: submission.value.password,
      password_confirmation: submission.value.password_confirmation,
      token: submission.value.token,
      email: submission.value.email,
    });
    return redirectWithToast("/login", {
      type: "success",
      title: "Password reset successfully",
      description: "Please login to your account",
    });
  } catch (exception: unknown) {
    if (exception instanceof Response && exception.status === 302) {
      throw exception;
    }

    if (exception instanceof Response) throw exception;

    if (exception instanceof AuthorizationError) {
      const error = exception as APIErrors;
      return json({
        serverError: error?.cause?.data?.message,
        lastResult: submission.reply(),
      });
    }

    return json({
      serverError: (exception as any).data.message,
      lastResult: submission.reply(),
    });

    throw exception;
  }

  return json({ lastResult: submission.reply(), serverError: "error jap" });
  // return redirect(`/?value=${JSON.stringify(submission.value)}`);
};

const LoginPage = () => {
  const actionData = useActionData<typeof action>();

  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult: actionData?.lastResult,

    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },

    // Validate the form on blur event triggered
    shouldValidate: "onBlur",
  });

  return (
    <Stack style={{ width: "100%" }}>
      <Title order={2} mb={10}>
        Reset Password
      </Title>{" "}
      {actionData?.serverError ? (
        <Alert variant="light" color="red" mb={4} style={{ width: "100%" }}>
          {actionData.serverError}
        </Alert>
      ) : null}
      <Form method="post" className={classes.form} {...getFormProps(form)}>
        <Stack gap="xs">
          <input type="hidden" name="token" value={token!} />
          <input type="hidden" name="email" value={email!} />
          <PasswordInput
            label="Password"
            size="md"
            {...getInputProps(fields.password, { type: "email" })}
            error={fields.password.errors}
          />

          <PasswordInput
            label="Password confirmation"
            size="md"
            {...getInputProps(fields.password_confirmation, { type: "email" })}
            error={fields.password_confirmation.errors}
          />
        </Stack>

        <Button fullWidth mt="xl" size="md" type="submit" loading={isPending}>
          Reset Password
        </Button>
      </Form>
    </Stack>
  );
};

interface APIErrors extends AuthorizationError {
  cause: {
    data?: {
      message: string;
      errors?: {
        [key: string]: string[];
      };
    };
    name: string;
    message: string;
    stack: string;
  };
}

export default LoginPage;
