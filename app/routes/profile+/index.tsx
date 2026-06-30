import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";
import {
  updateUserScale,
  updateUserSubscriptionStatus,
  updateUserTheme,
} from "#app/services/auth.server";
import {
  getCurrentUser,
  linkMendeley,
  requireAuth,
  unlinkMendeley,
  updateUser,
} from "#app/services/authentication.server";
import {
  createStripePortalSession,
  getCurrentUserSubscription,
  UserSubscription,
} from "#app/services/subscription.server";
import { getHints } from "#app/utils/client-hints";
import { redirectWithToast } from "#app/utils/toast.server";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { Box, Button, Grid, Group, Slider, Stack, Text } from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";

import { BreadcrumbHandle } from "../_index";
import classes from "./profile.module.css";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="user-circle-outline"
      style={{ width: "20px", height: "20px" }}
    />
  ),
  breadcrumb: "Profile",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [user, userRes, subscriptionRes] = await Promise.all([
    requireAuth({ request }),
    getCurrentUser({ request }),
    getCurrentUserSubscription({ request }),
  ]);

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
        {
          headers: {
            "Set-Cookie": newCookie,
          },
        }
      );
    }

    return json({
      user: userRes.data,
      subscription: subscriptionRes.data?.subscription,
      timeZone: getHints(request).timeZone,
    });
  }

  return json({
    user: userRes.data,
    subscription: subscriptionRes.data?.subscription,
    timeZone: getHints(request).timeZone,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "color-switch" || actionType === "scale-switch") {
    const color = formData.get("color") as string;
    const scale = formData.get("scale") as "xs" | "sm" | "md" | "lg" | "xl";
    const userId = formData.get("userId") as string;
    const res = await updateUser({
      user: {
        color_theme: color || undefined,
        scale: scale || undefined,
        id: parseInt(userId),
      },
      request,
    });

    // Update theme or scale in the session cookie
    const newCookie =
      actionType === "color-switch"
        ? await updateUserTheme(request, color)
        : await updateUserScale(request, scale);

    if (newCookie) {
      return json(
        { color, scale },
        {
          headers: {
            "Set-Cookie": newCookie,
          },
        }
      );
    }

    return json({ color, scale });
  }

  if (actionType === "linkMendeley") {
    const res = await linkMendeley({ request });
    if (res.data?.redirect_url) {
      return redirect(res.data.redirect_url);
    }
    return json({ error: "Failed to link account with Mendeley" });
  }

  if (actionType === "unlinkMendeley") {
    await unlinkMendeley({ request });
    return redirectWithToast("/profile", {
      type: "success",
      title: "Mendeley unlinked",
      description: "You have successfully unlinked your Mendeley account.",
    });
  }

  if (actionType === "manageSubscription") {
    const res = await createStripePortalSession({ request });
    if (res.data?.url) {
      return redirect(res.data.url);
    }
    return json({ error: "Failed to create stripe portal session" });
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

export const ProfilePage = () => {
  const navigation = useNavigation();
  const linkMendeleyLoading =
    navigation.state !== "idle" &&
    navigation.formData?.get("actionType") === "linkMendeley";
  const unlinkMendeleyLoading =
    navigation.state !== "idle" &&
    navigation.formData?.get("actionType") === "unlinkMendeley";
  const manageSubscriptionLoading =
    navigation.state !== "idle" &&
    navigation.formData?.get("actionType") === "manageSubscription";

  const { user, subscription, timeZone } = useLoaderData<typeof loader>();

  const profileFetcher = useFetcher<typeof action>();

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
      <div className={classes.container}>
        <Group justify="space-between" gap="sm">
          <Stack gap="xs">
            <Text size="lg" fw={700}>
              Subscription
            </Text>
            <Text size="sm">Manage your subscription here</Text>
          </Stack>
          <Box>
            {user?.subscription_status === null ? (
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  You didn't subscribed to any plan yet
                </Text>
                <Button component={Link} to="/subscription">
                  Subscribe now
                </Button>
              </Group>
            ) : (
              <>
                {user?.subscription_status === "inactive" ? (
                  <Button component={Link} to="/subscription">
                    Resubscribe
                  </Button>
                ) : (
                  <Form method="post">
                    <input
                      type="hidden"
                      name="actionType"
                      value="manageSubscription"
                    />
                    <Group wrap="nowrap">
                      <Button
                        loading={manageSubscriptionLoading}
                        type="submit"
                        fullWidth
                      >
                        Manage subscription
                      </Button>
                    </Group>
                  </Form>
                )}
              </>
            )}
          </Box>
        </Group>
      </div>
      <div className={classes.container}>
        <Group justify="space-between" gap="sm">
          <Stack gap="xs">
            <Text size="lg" fw={700}>
              Profile
            </Text>
            <Text size="sm">
              This is your profile page. You can edit your profile here.
            </Text>
          </Stack>
          <Box>
            {user?.is_mendeley_linked ? (
              <Form method="post">
                <input type="hidden" name="actionType" value="unlinkMendeley" />
                <Button
                  loading={unlinkMendeleyLoading}
                  type="submit"
                  color="red"
                  fullWidth
                >
                  Unlink Mendeley
                </Button>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="actionType" value="linkMendeley" />
                <Button loading={linkMendeleyLoading} type="submit" fullWidth>
                  Link with Mendeley
                </Button>
              </Form>
            )}
          </Box>
        </Group>
      </div>

      <div>
        <Group justify="space-between">
          <Text size="sm" fw={700}>
            Theme
          </Text>
          <Button.Group>
            <Button
              mod={user?.color_theme === "pink" ? "selected" : undefined}
              className={classes.themeButton}
              variant="default"
              onClick={() => handleThemeChange("pink", user?.id)}
            >
              <div
                style={{
                  width: "25px",
                  height: "25px",
                  borderRadius: "50%",
                  backgroundColor: "var(--mantine-color-pink-5)",
                }}
              />
            </Button>
            <Button
              variant="default"
              mod={user?.color_theme === "teal" ? "selected" : undefined}
              className={classes.themeButton}
              onClick={() => handleThemeChange("teal", user?.id)}
            >
              <div
                style={{
                  width: "25px",
                  height: "25px",
                  borderRadius: "50%",
                  backgroundColor: "var(--mantine-color-teal-5)",
                }}
              />
            </Button>
            <Button
              variant="default"
              mod={user?.color_theme === "blue" ? "selected" : undefined}
              className={classes.themeButton}
              onClick={() => handleThemeChange("blue", user?.id)}
            >
              <div
                style={{
                  width: "25px",
                  height: "25px",
                  borderRadius: "50%",
                  backgroundColor: "var(--mantine-color-blue-5)",
                }}
              />
            </Button>
            <Button
              variant="default"
              mod={user?.color_theme === "orange" ? "selected" : undefined}
              className={classes.themeButton}
              onClick={() => handleThemeChange("orange", user?.id)}
            >
              <div
                style={{
                  width: "25px",
                  height: "25px",
                  borderRadius: "50%",
                  backgroundColor: "var(--mantine-color-orange-5)",
                }}
              />
            </Button>
          </Button.Group>
        </Group>
      </div>
      <CDivider darkColor="var(--mantine-color-dark-5)" />
      <Grid>
        <Grid.Col span="auto">
          <Text size="sm" fw={700}>
            Font Size
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Box>
            <Slider
              defaultValue={
                marks.findIndex((mark) => mark.label === user?.scale) * 25
              }
              label={(val) => marks.find((mark) => mark.value === val)!.label}
              step={25}
              marks={marks}
              styles={{ markLabel: { display: "none" } }}
              onChange={(value) =>
                handleScaleChange(marks[value / 25].label, user?.id)
              }
            />
          </Box>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

const SubscriptionInfo = ({
  subscription,
  timeZone,
}: {
  subscription: UserSubscription;
  timeZone: string;
}) => {
  const formatDate = (date: string) => {
    return dayjs(date).tz(timeZone).format("DD MMMM YYYY");
  };
  return (
    <Box className={classes.subscriptionInfo}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="xs">Plan</Text>
          <Text size="sm" fw={700}>
            {subscription?.plan_name}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="xs">Status</Text>
          <Text size="sm" fw={700}>
            {subscription?.status}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="xs">Export Limit Remaining</Text>
          {subscription?.unlimited_export ? (
            <Text size="sm" fw={700}>
              Unlimited
            </Text>
          ) : (
            <Text size="sm" fw={700}>
              {subscription?.export_limit_remaining}
            </Text>
          )}
        </Group>
        <Group justify="space-between">
          <Text size="xs">Subscription End</Text>
          <Text size="sm" fw={700}>
            {formatDate(subscription?.current_period_end!)}
          </Text>
        </Group>
      </Stack>
    </Box>
  );
};

export default ProfilePage;
