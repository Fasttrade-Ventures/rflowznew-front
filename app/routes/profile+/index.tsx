import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";
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
  Slider,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useRouteLoaderData,
} from "@remix-run/react";

import { ChangePasswordCard, changePasswordSchema } from "#app/components/v2/ChangePasswordCard";
import { PageBreadcrumb, PageTitleBlock, V2Card } from "#app/components/v2/V2UIKit";
import { loader as rootLoader } from "#app/root";
import { BreadcrumbHandle } from "../_index";
import classes from "#app/components/v2/v2.module.css";
import legacyClasses from "./profile.module.css";
import { parseWithZod } from "@conform-to/zod";

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

  if (user.subscription_status !== userRes.data?.subscription_status) {
    const newCookie = await updateUserSubscriptionStatus(
      request,
      userRes.data?.subscription_status || null
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

const marks = [
  { value: 0, label: "xs" },
  { value: 25, label: "sm" },
  { value: 50, label: "md" },
  { value: 75, label: "lg" },
  { value: 100, label: "xl" },
];

function ProfileV2() {
  const navigation = useNavigation();
  const { user, subscription, formatting } = useLoaderData<typeof loader>();
  const profileFetcher = useFetcher<typeof action>();
  const actionData = useActionData<typeof action>();
  const manageSubscriptionLoading =
    navigation.state !== "idle" &&
    navigation.formData?.get("actionType") === "manageSubscription";

  const handleThemeChange = (color: string) => {
    const formData = new FormData();
    formData.append("color", color);
    formData.append("actionType", "color-switch");
    formData.append("userId", user?.id?.toString() || "");
    profileFetcher.submit(formData, { method: "post" });
  };

  const handleScaleChange = (value: number) => {
    const formData = new FormData();
    formData.append("scale", marks[value / 25].label);
    formData.append("actionType", "scale-switch");
    formData.append("userId", user?.id?.toString() || "");
    profileFetcher.submit(formData, { method: "post" });
  };

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

          <div
            className={classes.v2Card}
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
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
            <Group gap={10} align="flex-start" wrap="nowrap">
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

          <ChangePasswordCard actionData={actionData ?? undefined} />

          <V2Card title="Appearance" subtitle="Theme color and font size">
            <Group justify="space-between">
              <Text size="sm" fw={600}>
                Theme
              </Text>
              <Button.Group>
                {(["pink", "teal", "blue", "orange"] as const).map((color) => (
                  <Button
                    key={color}
                    variant="default"
                    className={legacyClasses.themeButton}
                    mod={user?.color_theme === color ? "selected" : undefined}
                    onClick={() => handleThemeChange(color)}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: `var(--mantine-color-${color}-5)`,
                      }}
                    />
                  </Button>
                ))}
              </Button.Group>
            </Group>
            <CDivider darkColor="var(--rz-border)" />
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="sm" fw={600}>
                Font size
              </Text>
              <Box style={{ flex: 1, maxWidth: 180 }}>
                <Slider
                  defaultValue={
                    marks.findIndex((mark) => mark.label === user?.scale) * 25
                  }
                  label={(val) => marks.find((mark) => mark.value === val)!.label}
                  step={25}
                  marks={marks}
                  styles={{ markLabel: { display: "none" } }}
                  onChange={handleScaleChange}
                />
              </Box>
            </Group>
          </V2Card>
        </Stack>
      </div>
    </div>
  );
}

export const ProfilePage = () => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  if (rootData?.paperV2Flow) {
    return <ProfileV2 />;
  }

  const navigation = useNavigation();
  const { user, subscription, timeZone, formatting } =
    useLoaderData<typeof loader>();
  const profileFetcher = useFetcher<typeof action>();
  const actionData = useActionData<typeof action>();

  const handleThemeChange = (color: string, userId?: number) => {
    const formData = new FormData();
    formData.append("color", color);
    formData.append("actionType", "color-switch");
    formData.append("userId", userId?.toString() || "");
    profileFetcher.submit(formData, { method: "post" });
  };

  const handleScaleChange = (scale: string, userId?: number) => {
    const formData = new FormData();
    formData.append("scale", scale);
    formData.append("actionType", "scale-switch");
    formData.append("userId", userId?.toString() || "");
    profileFetcher.submit(formData, { method: "post" });
  };

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
      <Group justify="space-between">
        <Text size="sm" fw={700}>
          Theme
        </Text>
        <Button.Group>
          {(["pink", "teal", "blue", "orange"] as const).map((color) => (
            <Button
              key={color}
              variant="default"
              className={legacyClasses.themeButton}
              mod={user?.color_theme === color ? "selected" : undefined}
              onClick={() => handleThemeChange(color, user?.id)}
            >
              <div
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: "50%",
                  backgroundColor: `var(--mantine-color-${color}-5)`,
                }}
              />
            </Button>
          ))}
        </Button.Group>
      </Group>
      <CDivider darkColor="var(--mantine-color-dark-5)" />
      <Slider
        defaultValue={marks.findIndex((mark) => mark.label === user?.scale) * 25}
        step={25}
        marks={marks}
        onChange={(value) =>
          handleScaleChange(marks[value / 25].label, user?.id)
        }
      />
      {formatting.preferences && (
        <FormattingPanel
          preferences={formatting.preferences}
          isCustomized={formatting.isCustomized}
        />
      )}
      <ChangePasswordCard actionData={actionData ?? undefined} />
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
