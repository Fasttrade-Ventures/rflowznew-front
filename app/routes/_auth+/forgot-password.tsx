import {
  Alert,
  Anchor,
  Button,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { z } from "zod";

import { useIsPending } from "#app/utils/misc";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import {
  forgotPassword,
  requireGuest,
} from "#app/services/authentication.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { AuthorizationError } from "remix-auth";
import classes from "./authPage.module.css";
import { isErrorWithMessage } from "./email.verify";

const schema = z.object({
  email: z.string().email().min(1),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireGuest({ request });
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply(), serverError: null });
  }

  try {
    await forgotPassword({ email: submission.value.email });
    return redirectWithToast("/login", {
      type: "success",
      title: "Password reset link has been sent to your email",
      description: "Please check your email to reset your password",
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

    if (isErrorWithMessage(exception)) {
      return json({
        lastResult: submission.reply(),
        serverError: exception.data.message,
      });
    }

    return json({
      lastResult: submission.reply(),
      serverError: "Something went wrong, please try again later",
    });
  }
};

const LoginPage = () => {
  const actionData = useActionData<typeof action>();

  const isPending = useIsPending();

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

  console.log("ALL ERRORS", form.allErrors);

  return (
    <Stack style={{ width: "100%" }}>
      <Title order={2} mb={10}>
        Forgot Password
      </Title>{" "}
      {actionData?.serverError ? (
        <Alert variant="light" color="red" mb={4} style={{ width: "100%" }}>
          {actionData.serverError}
        </Alert>
      ) : null}
      <Form method="post" className={classes.form} {...getFormProps(form)}>
        <TextInput
          label="Email address"
          placeholder="hello@gmail.com"
          size="md"
          {...getInputProps(fields.email, { type: "email" })}
          error={fields.email.errors}
        />

        <Button fullWidth mt="xl" size="md" type="submit" loading={isPending}>
          Send me a reset link
        </Button>
        <Stack gap={2} mt="md">
          <Text>
            Don't have an account?{" "}
            <Anchor component={Link} to={`/register`} fw={700}>
              Register here
            </Anchor>
          </Text>
          <Text>
            Remmeber your password?{" "}
            <Anchor component={Link} to={`/forgot-password`} fw={700}>
              Login here
            </Anchor>
          </Text>
        </Stack>
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
