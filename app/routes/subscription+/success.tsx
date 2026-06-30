import { Icon } from "#app/components/icon";
import { updateUserSubscriptionStatus } from "#app/services/auth.server";
import { confirmSubscription } from "#app/services/subscription.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { Button, Group, List, Stack, Text, Title } from "@mantine/core";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import React from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (sessionId) {
    const res = await confirmSubscription({
      request,
      stripecheckoutSessionId: sessionId,
    });

    const newCookie = await updateUserSubscriptionStatus(
      request,
      res.data?.subscription_status || null
    );

    if (newCookie) {
      return redirectWithToast(
        ".",
        {
          title: "Subscription Successful",
          description: "Thank you for subscribing to our service.",
          type: "success",
        },
        {
          headers: {
            "Set-Cookie": newCookie,
          },
        }
      );
    }
  }

  return null;
};

export const SubscriptionSuccessPage: React.FC = () => {
  return (
    <Stack gap="md" align="center">
      <Group gap="sm" align="center">
        <Icon
          name="pika-check"
          style={{ width: "36px", height: "36px" }}
          color="var(--mantine-color-green-5)"
        />
        <Title order={1} c="green" ta="center">
          Subscription Successful!
        </Title>
      </Group>
      <Text size="lg" ta="center">
        Thank you for subscribing to our service. We&apos;re thrilled to have
        you on board!
      </Text>
      <Title order={2} size="h3">
        What&apos;s Next?
      </Title>
      <List
        spacing="sm"
        size="md"
        center
        icon={
          <Icon
            name="chevron-right"
            style={{
              width: "16px",
              height: "16px",
              color: "var(--mantine-primary-color-filled)",
            }}
          />
        }
      >
        <List.Item>Check your email for a confirmation message</List.Item>
        <List.Item>Explore your new features and benefits</List.Item>
      </List>
      <Text ta="center">
        If you have any questions or need assistance, don&apos;t hesitate to
        contact our support team at support@rflowz.com
      </Text>
      <Button component={Link} to="/" variant="filled">
        Go to Homepage
      </Button>
    </Stack>
  );
};

export default SubscriptionSuccessPage;
