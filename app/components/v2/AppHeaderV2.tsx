import NavbarAvatar from "#app/components/ui/NavbarAvatar";
import { ThemeSwitch } from "#app/routes/resources+/theme-switch";
import { loader as rootLoader } from "#app/root.tsx";
import { useIsPending } from "#app/utils/misc";
import { displayFirstName, getPlanDisplayLabel } from "#app/utils/plan";
import { Badge, Group, Loader, Menu, rem, Stack, Text } from "@mantine/core";
import { Form, Link, useRouteLoaderData } from "@remix-run/react";

import classes from "./v2.module.css";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function AppHeaderV2() {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const user = rootData?.user;
  const isPending = useIsPending();
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const firstName = displayFirstName(user?.name, user?.email);
  const greet = `${greetingForHour(now.getHours())}, ${firstName}`;
  const planLabel = getPlanDisplayLabel(
    user?.plan_key,
    user?.subscription_status
  );

  return (
    <header className={classes.header}>
      <Stack gap={2} className={classes.headerIntro}>
        <Text className={classes.headerDate}>{dateLabel}</Text>
        <Text className={classes.headerGreet}>{greet}</Text>
      </Stack>

      <Group gap={8} wrap="nowrap" className={classes.headerActions}>
        <Badge size="sm" variant="light" color="blue" className={classes.planBadge}>
          {planLabel}
        </Badge>

        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <button type="button" className={classes.profileBtn}>
              <NavbarAvatar username={user?.name ?? ""} />
              <Text size="xs" fw={500} className={classes.profileName}>
                {firstName}
              </Text>
              <Text size="xs" c="dimmed" className={classes.profileCaret}>
                ▾
              </Text>
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item component={Link} to="/profile">
              Profile
            </Menu.Item>
            <Menu.Item component={Link} to="/subscription">
              Subscription
            </Menu.Item>
            <Menu.Item closeMenuOnClick={false}>
              <Group justify="space-between" wrap="nowrap">
                Theme
                <ThemeSwitch
                  userPreference={rootData?.requestInfo.userPrefs.theme || null}
                />
              </Group>
            </Menu.Item>
            <Form method="post" action="/logout">
              <Menu.Item
                type="submit"
                leftSection={
                  isPending ? (
                    <Loader color="dark" size={rem(13)} />
                  ) : undefined
                }
              >
                Logout
              </Menu.Item>
            </Form>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </header>
  );
}
