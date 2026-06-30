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
import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";

import { useIsPending } from "#app/utils/misc";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import { GeneralErrorBoundary } from "#app/components/error-boundary";
import {
  authenticate,
  requireGuest,
} from "#app/services/authentication.server";
import { getToast } from "#app/utils/toast.server";
import { AuthorizationError } from "remix-auth";
import classes from "./authPage.module.css";
import { Icon } from "#app/components/icon";

const schema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(8),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const googleSignInErrorMessage = url.searchParams.get(
    "googleSignInErrorMessage"
  );

  await requireGuest({ request });
  const { toast } = await getToast(request);
  return json({ toast, googleSignInErrorMessage });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const newReq = request.clone();
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  console.log("submission :>> ", submission);

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply(), serverError: null });
  }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo");

  try {
    await authenticate({
      request: newReq,
      redirectTo: redirectTo,
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

    throw exception;
  }

  return json({ lastResult: submission.reply(), serverError: "error jap" });
  // return redirect(`/?value=${JSON.stringify(submission.value)}`);
};

const LoginPage = () => {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

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

  return (
    <Stack style={{ width: "100%" }}>
      {loaderData.googleSignInErrorMessage ? (
        <Alert variant="light" color="red" mb={4} style={{ width: "100%" }}>
          {loaderData.googleSignInErrorMessage}
        </Alert>
      ) : null}
      <Title order={2} mb={10}>
        Login
      </Title>
      {loaderData.toast ? (
        <Alert
          color={
            loaderData.toast.type === "success"
              ? "green"
              : loaderData.toast.type === "error"
              ? "red"
              : "blue"
          }
        >
          {loaderData.toast.description}
        </Alert>
      ) : null}
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
          error={fields.email.errors?.[0]}
        />

        <PasswordInput
          label="Password"
          placeholder="Your password"
          mt="md"
          size="md"
          {...getInputProps(fields.password, { type: "password" })}
          error={fields.password.errors?.[0]}
        />

        <Button fullWidth mt="xl" size="md" type="submit" loading={isPending}>
          Login
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
          Sign in with Google
        </Button>
      </Form>

      <Stack gap={2} mt="md">
        <Text>
          Don't have an account?{" "}
          <Anchor component={Link} to={`/register`} fw={700}>
            Register here
          </Anchor>
        </Text>
        <Text>
          Forgot your password?{" "}
          <Anchor component={Link} to={`/forgot-password`} fw={700}>
            Click here
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

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        403: ({ error }) => (
          <p>You are not allowed to do that: {error?.data}</p>
        ),
        // 404: ({ error }) => {
        //   return <p>Tak boleh buek camtu bang: {error?.data.message}</p>;
        // },
      }}
    />
  );
}

export default LoginPage;
