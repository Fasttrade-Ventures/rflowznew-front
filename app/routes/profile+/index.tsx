import { Icon } from "#app/components/icon";
import { FormattingPanel } from "#app/components/formatting-panel";
import {
  updateUserScale,
  updateUserSubscriptionStatus,
  updateUserTheme,
} from "#app/services/auth.server";
import {
  changePassword,
  getCurrentUser,
  requireAuth,
  updateUser,
} from "#app/services/authentication.server";
import {
  createStripePortalSession,
  getCurrentUserSubscription,
  type UserSubscription,
} from "#app/services/subscription.server";
import {
  FormattingPreferences,
  getFormattingPreferences,
  resetFormattingPreferences,
  saveFormattingPreferences,
} from "#app/services/formatting.server";
import { getHints } from "#app/utils/client-hints";
import { APIValidationError } from "#app/utils/error/api-validation-error";
import { canManageStripeBilling } from "#app/utils/plan";
import { redirectWithToast } from "#app/utils/toast.server";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  Box,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
  type SerializeFrom,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useRouteLoaderData,
} from "@remix-run/react";

import { ChangePasswordCard, changePasswordSchema } from "#app/components/v2/ChangePasswordCard";
import { AppearanceCard } from "#app/components/v2/AppearanceCard";
import { PageBreadcrumb, PageTitleBlock, V2Card } from "#app/components/v2/V2UIKit";
import { loader as rootLoader } from "#app/root";
import { BreadcrumbHandle } from "../_index";
import classes from "#app/components/v2/v2.module.css";
import legacyClasses from "./profile.module.css";
import { parseWithZod } from "@conform-to/zod";
import type { SubmissionResult } from "@conform-to/react";

function getChangePasswordActionData(
  actionData:
    | {
        passwordResult?: SubmissionResult<string[]>;
        passwordServerError?: string | null;
      }
    | { message: string }
    | { color?: string; scale?: string }
    | null
    | undefined
) {
  if (!actionData || !("passwordResult" in actionData)) {
    return undefined;
  }
  return actionData;
}

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="user-circle-outline"
      style={{ width: "20px", height: "20px" }}
    />
  ),
  breadcrumb: "Profile",
};

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [user, userRes, subscriptionRes, formattingRes] = await Promise.all([
    requireAuth({ request }),
    getCurrentUser({ request }),
    getCurrentUserSubscription({ request }),
    getFormattingPreferences({ request }),
  ]);

  const formatting = {
    preferences: formattingRes.data?.preferences,
    isCustomized: formattingRes.data?.is_customized ?? false,
  };

  if (
    user.subscription_status !== userRes.data?.subscription_status ||
    user.plan_key !== userRes.data?.plan_key
  ) {
    const newCookie = await updateUserSubscriptionStatus(
      request,
      userRes.data?.subscription_status || null,
      userRes.data?.plan_key ?? null
    );
    if (newCookie) {
      return redirectWithToast(
        ".",
        {
          title: "Subscription status synced successfully",
          description: "Your subscription status has been updated.",
          type: "success",
        },
        { headers: { "Set-Cookie": newCookie } }
      );
    }

    return json({
      user: userRes.data,
      subscription: subscriptionRes.data?.subscription,
      timeZone: getHints(request).timeZone,
      formatting,
    });
  }

  return json({
    user: userRes.data,
    subscription: subscriptionRes.data?.subscription,
    timeZone: getHints(request).timeZone,
    formatting,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const intent = formData.get("intent");

  if (intent === "change-password") {
    const submission = parseWithZod(formData, { schema: changePasswordSchema });

    if (submission.status !== "success") {
      return json({
        passwordResult: submission.reply(),
        passwordServerError: null,
      });
    }

    try {
      await changePassword({
        request,
        ...submission.value,
      });

      return redirectWithToast("/profile", {
        type: "success",
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      if (error instanceof APIValidationError) {
        const fieldErrors = error.data?.errors as
          | Record<string, string[]>
          | undefined;
        const message =
          fieldErrors?.current_password?.[0] ??
          fieldErrors?.password?.[0] ??
          error.data?.message ??
          "Unable to update password.";

        return json({
          passwordResult: submission.reply({
            fieldErrors: fieldErrors
              ? Object.fromEntries(
                  Object.entries(fieldErrors).map(([key, messages]) => [
                    key,
                    messages,
                  ])
                )
              : undefined,
            formErrors: fieldErrors ? [] : [message],
          }),
          passwordServerError: message,
        });
      }

      throw error;
    }
  }

  if (intent === "save-formatting") {
    const preferences = JSON.parse(
      formData.get("preferences") as string
    ) as FormattingPreferences;
    const res = await saveFormattingPreferences({ request, preferences });
    return json({ message: res.data?.message ?? "Formatting saved" });
  }

  if (intent === "reset-formatting") {
    const res = await resetFormattingPreferences({ request });
    return json({ message: res.data?.message ?? "Formatting reset" });
  }

  if (actionType === "color-switch" || actionType === "scale-switch") {
    const color = formData.get("color") as string;
    const scale = formData.get("scale") as "xs" | "sm" | "md" | "lg" | "xl";
    const userId = formData.get("userId") as string;
    await updateUser({
      user: {
        color_theme: color || undefined,
        scale: scale || undefined,
        id: parseInt(userId),
      },
      request,
    });

    const newCookie =
      actionType === "color-switch"
        ? await updateUserTheme(request, color)
        : await updateUserScale(request, scale);

    if (newCookie) {
      return json({ color, scale }, { headers: { "Set-Cookie": newCookie } });
    }
    return json({ color, scale });
  }

  if (actionType === "manageSubscription") {
    try {
      const res = await createStripePortalSession({ request });
      if (res.data?.url) return redirect(res.data.url);
    } catch (error) {
      if (error instanceof APIValidationError) {
        return redirectWithToast("/profile", {
          type: "error",
          title: "Billing portal unavailable",
          description:
            "Billing can only be managed for subscriptions purchased through Stripe.",
        });
      }
      throw error;
    }
    return redirectWithToast("/profile", {
      type: "error",
      title: "Billing portal unavailable",
      description: "Unable to open the billing portal right now.",
    });
  }

  return null;
};

function ProfileV2({
  user,
  subscription,
  timeZone,
  formatting,
  actionData,
  manageSubscriptionLoading,
}: {
  user: SerializeFrom<typeof loader>["user"];
  subscription: SerializeFrom<typeof loader>["subscription"];
  timeZone: string;
  formatting: SerializeFrom<typeof loader>["formatting"];
  actionData: ReturnType<typeof useActionData<typeof action>>;
  manageSubscriptionLoading: boolean;
}) {
  return (
    <div className={classes.dashboard}>
      <PageBreadcrumb>Home → Profile</PageBreadcrumb>
      <PageTitleBlock
        title="Profile"
        subtitle="Account, theme, and document formatting"
      />

      <div className={classes.profileGrid}>
        <Stack gap={10}>
          {subscription && (
            <V2Card>
              <div className={classes.kvRow}>
                <span className={classes.kvLabel}>Plan</span>
                <span className={classes.kvValue}>{subscription.plan_name}</span>
              </div>
              <div className={classes.kvRow}>
                <span className={classes.kvLabel}>Status</span>
                <span className={classes.kvValue}>{subscription.status}</span>
              </div>
              {subscription.current_period_end ? (
                <div className={classes.kvRow}>
                  <span className={classes.kvLabel}>Renews</span>
                  <span className={classes.kvValue}>
                    {dayjs(subscription.current_period_end)
                      .tz(timeZone)
                      .format("DD MMM YYYY")}
                  </span>
                </div>
              ) : null}
              <div className={classes.kvRow}>
                <span className={classes.kvLabel}>Proposal limit</span>
                <span className={classes.kvValue}>
                  {subscription.proposal_limit_remaining ?? "—"}
                </span>
              </div>
              <div className={classes.kvRow}>
                <span className={classes.kvLabel}>AI generations</span>
                <span className={classes.kvValue}>
                  {subscription.ai_limit_remaining ?? "—"}
                </span>
              </div>
              <div className={classes.kvRow}>
                <span className={classes.kvLabel}>Export limit</span>
                <span className={classes.kvValue}>
                  {subscription.unlimited_export
                    ? "Unlimited"
                    : subscription.export_limit_remaining}
                </span>
              </div>
            </V2Card>
          )}

          <div className={`${classes.v2Card} ${classes.profileSubscriptionRow}`}>
            <div>
              <div className={classes.v2CardTitle}>Subscription</div>
              <div className={classes.v2CardSub}>
                Manage billing and plan upgrades
              </div>
            </div>
            {user?.subscription_status === null ? (
              <Button component={Link} to="/subscription" size="xs">
                Subscribe
              </Button>
            ) : subscription?.plan_key === "free" ? (
              <Button component={Link} to="/subscription" size="xs">
                Upgrade plan
              </Button>
            ) : canManageStripeBilling(subscription) ? (
              <Form method="post">
                <input type="hidden" name="actionType" value="manageSubscription" />
                <Button size="xs" type="submit" loading={manageSubscriptionLoading}>
                  Manage billing
                </Button>
              </Form>
            ) : (
              <Button component={Link} to="/subscription" size="xs">
                View plans
              </Button>
            )}
          </div>

          {formatting.preferences && (
            <V2Card title="Document formatting" subtitle="Margins, typography, citations">
              <FormattingPanel
                preferences={formatting.preferences}
                isCustomized={formatting.isCustomized}
              />
            </V2Card>
          )}
        </Stack>

        <Stack gap={10}>
          <V2Card title="Profile" subtitle="Your account information">
            <Group gap={10} align="flex-start" wrap="wrap">
              <Box
                style={{
                  alignItems: "center",
                  background: "var(--rz-primary)",
                  borderRadius: 999,
                  color: "#fff",
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 600,
                  height: 40,
                  justifyContent: "center",
                  width: 40,
                }}
              >
                {user?.name?.charAt(0) ?? "?"}
              </Box>
              <Stack gap={2} style={{ flex: 1 }}>
                <Text size="sm" fw={600}>
                  {user?.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {user?.email}
                </Text>
              </Stack>
            </Group>
            <TextInput label="Display name" value={user?.name ?? ""} size="xs" readOnly />
            <TextInput label="Email" value={user?.email ?? ""} size="xs" readOnly />
          </V2Card>

          <ChangePasswordCard
            actionData={getChangePasswordActionData(actionData)}
          />

          <AppearanceCard
            userId={user?.id}
            colorTheme={user?.color_theme}
            fontScale={user?.scale}
          />
        </Stack>
      </div>
    </div>
  );
}

export const ProfilePage = () => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const navigation = useNavigation();
  const { user, subscription, timeZone, formatting } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const manageSubscriptionLoading =
    navigation.state !== "idle" &&
    navigation.formData?.get("actionType") === "manageSubscription";

  if (rootData?.paperV2Flow) {
    return (
      <ProfileV2
        user={user}
        subscription={subscription}
        timeZone={timeZone}
        formatting={formatting}
        actionData={actionData}
        manageSubscriptionLoading={manageSubscriptionLoading}
      />
    );
  }

  return (
    <Stack gap="sm">
      {subscription ? (
        <SubscriptionInfo subscription={subscription} timeZone={timeZone} />
      ) : null}
      <div className={legacyClasses.container}>
        <Group justify="space-between" gap="sm">
          <Stack gap="xs">
            <Text size="lg" fw={700}>
              Subscription
            </Text>
            <Text size="sm">Manage your subscription here</Text>
          </Stack>
          <Box>
            {user?.subscription_status === null ? (
              <Button component={Link} to="/subscription">
                Subscribe now
              </Button>
            ) : subscription?.plan_key === "free" ? (
              <Button component={Link} to="/subscription">
                Upgrade plan
              </Button>
            ) : (
              <Button component={Link} to="/subscription">
                Manage
              </Button>
            )}
          </Box>
        </Group>
      </div>
      <div className={legacyClasses.container}>
        <AppearanceCard
          variant="legacy"
          userId={user?.id}
          colorTheme={user?.color_theme}
          fontScale={user?.scale}
        />
      </div>
      {formatting.preferences && (
        <FormattingPanel
          preferences={formatting.preferences}
          isCustomized={formatting.isCustomized}
        />
      )}
      <ChangePasswordCard
        actionData={getChangePasswordActionData(actionData)}
      />
    </Stack>
  );
};

const SubscriptionInfo = ({
  subscription,
  timeZone,
}: {
  subscription: UserSubscription;
  timeZone: string;
}) => (
  <Box className={legacyClasses.subscriptionInfo}>
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="xs">Plan</Text>
        <Text size="sm" fw={700}>
          {subscription.plan_name}
        </Text>
      </Group>
      <Group justify="space-between">
        <Text size="xs">Status</Text>
        <Text size="sm" fw={700}>
          {subscription.status}
        </Text>
      </Group>
      {subscription.current_period_end && (
        <Group justify="space-between">
          <Text size="xs">Renews</Text>
          <Text size="sm" fw={700}>
            {dayjs(subscription.current_period_end).tz(timeZone).format("DD MMM YYYY")}
          </Text>
        </Group>
      )}
    </Stack>
  </Box>
);

export default ProfilePage;
