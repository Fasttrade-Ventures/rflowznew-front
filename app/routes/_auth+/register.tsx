import {
  Alert,
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Divider,
} from "@mantine/core";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useParams } from "@remix-run/react";
import { z } from "zod";

import { useIsPending } from "#app/utils/misc";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import { register, requireGuest } from "#app/services/authentication.server";
import { AuthorizationError } from "remix-auth";
import classes from "./authPage.module.css";
import { redirectWithToast } from "#app/utils/toast.server";
import { authenticator } from "#app/services/auth.server";
import { commitSession, getSession } from "#app/services/session.server";
import { Icon } from "#app/components/icon";

const schema = z.object({
  email: z.string().email().min(1),
  name: z.string().min(1),
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
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
    const res = await register({
      name: submission.value.name,
      email: submission.value.email,
      password: submission.value.password,
      password_confirmation: submission.value.password_confirmation,
    });

    let session = await getSession(request.headers.get("cookie"));

    session.set(authenticator.sessionKey, res.data?.user);

    return redirectWithToast(
      "/verify-email",
      {
        title: "Succesfully registered",
        type: "success",
        description: `Please verify your email to continue`,
      },
      {
        headers: { "Set-Cookie": await commitSession(session) },
      }
    );
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

    // throw exception;
  }

  return json({ lastResult: submission.reply(), serverError: "error jap" });
};

const RegisterPage = () => {
  const actionData = useActionData<typeof action>();

  const isPending = useIsPending();
  const params = useParams();

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
        Register
      </Title>
      {actionData?.serverError ? (
        <Alert variant="light" color="red" mb={4} style={{ width: "100%" }}>
          {actionData.serverError}
        </Alert>
      ) : null}
      <Form method="post" className={classes.form} {...getFormProps(form)}>
        <Stack align="stretch" justify="center" gap="sm">
          <TextInput
            label="Email address"
            placeholder="hello@gmail.com"
            size="md"
            {...getInputProps(fields.email, { type: "email" })}
            error={fields.email.errors}
          />
          <TextInput
            label="Name"
            placeholder="Your name"
            size="md"
            {...getInputProps(fields.name, { type: "text" })}
            error={fields.name.errors}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            size="md"
            {...getInputProps(fields.password, { type: "password" })}
            error={fields.password.errors}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            size="md"
            {...getInputProps(fields.password_confirmation, {
              type: "password",
            })}
            error={fields.password_confirmation.errors}
          />
        </Stack>

        <Button fullWidth mt="xl" size="md" type="submit" loading={isPending}>
          Register
        </Button>
      </Form>

      <Divider my="xs" label="Or" labelPosition="center" />

      <Form action="/auth/google" method="post">
        <Button
          fullWidth
          variant="outline"
          leftSection={
            <Icon name="pika-google" style={{ width: 18, height: 18 }} />
          }
          type="submit"
        >
          Sign up with Google
        </Button>
      </Form>

      <Stack gap={2} mt="md">
        <Text>
          Already have an account?{" "}
          <Anchor component={Link} to={`/login`} fw={700}>
            Login here
          </Anchor>
        </Text>
      </Stack>
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

export default RegisterPage;
