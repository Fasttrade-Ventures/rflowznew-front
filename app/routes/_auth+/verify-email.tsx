import { authenticator } from "#app/services/auth.server";
import {
  getCurrentUser,
  requireAuth,
  resendVerificationEmail,
} from "#app/services/authentication.server";
import { commitSession, getSession } from "#app/services/session.server";
import { redirectWithToast } from "#app/utils/toast.server";
import {
  Alert,
  Anchor,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { isErrorWithMessage } from "./email.verify";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request, redirectTo: "/verify-email" });
  const userRes = await getCurrentUser({ request });

  if (userRes.data?.email_verified_at) {
    const updatedUserVerifiedAt = {
      ...user,
      email_verified_at: userRes.data?.email_verified_at,
    };
    const session = await getSession(request.headers.get("cookie"));
    session.set(authenticator.sessionKey, updatedUserVerifiedAt);
    const headers = new Headers({
      "Set-Cookie": await commitSession(session),
    });
    throw await redirectWithToast(
      `/`,
      {
        description: "Email already verified",
        type: "success",
      },
      {
        headers,
      }
    );
  }

  return json({ user });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireAuth({
    request,
    redirectTo: `/${params.team}/verify-email`,
  });
  try {
    const msg = await resendVerificationEmail({ request });
    return json({ success: true, message: msg });
  } catch (error) {
    if (isErrorWithMessage(error)) {
      return json({ success: false, message: error.data.message });
    } else {
      return json({
        success: false,
        message: "An unknown error occurred",
      });
    }
  }
};

export const EmailVerifyPage = () => {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isLoggingOut =
    navigation.state !== "idle" && navigation.formAction === "/logout";

  return (
    <Stack style={{ width: "100%" }}>
      {actionData?.message ? (
        <Alert variant="light" color={actionData?.success ? "green" : "red"}>
          {actionData?.message}
        </Alert>
      ) : null}
      <Stack gap={5}>
        <Title order={2}>Verify your email</Title>
        <Text size="sm">
          Please check your email ({user.email}) and click on the link for
          verification.
        </Text>
      </Stack>
      <Stack gap={5}>
        <Form method="post">
          <Anchor size="sm" component="button" type="submit">
            Resend verification email
          </Anchor>
        </Form>

        <Form method="post" action={"/logout"}>
          <Group gap={5}>
            {isLoggingOut && <Loader size="xs" />}
            <Anchor size="xs" component="button" type="submit" c="dimmed">
              Wrong email? Logout
            </Anchor>
          </Group>
        </Form>
      </Stack>
    </Stack>
  );
};

export default EmailVerifyPage;
