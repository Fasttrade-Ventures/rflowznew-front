import BreadcrumbsComponent from "#app/components/breadcrumbs/breadcrumbs";
import { Icon } from "#app/components/icon";
import { loader as rootLoader } from "#app/root.tsx";
import { ThemeSwitch } from "#app/routes/resources+/theme-switch";
import { useIsPending } from "#app/utils/misc";
import { ReactNode } from "react";

import {
  AppShell,
  Container,
  Group,
  Loader,
  Menu,
  rem,
  Spoiler,
  Stack,
  Text,
} from "@mantine/core";
import { Form, Link, useRouteLoaderData } from "@remix-run/react";

import classes from "./AppLayout.module.css";
import NavbarAvatar from "./ui/NavbarAvatar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const user = rootData?.user;

  const isPending = useIsPending();

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header classNames={{ header: classes.header }}>
        <div className={classes.navBox}>
          <Container className={classes.navContainer}>
            <Group justify="space-between" w={"100%"}>
              <Group>
                {/* <Text
                  component={Link}
                  to="/"
                  size="lg"
                  fw={700}
                  variant="gradient"
                >
                  RFlowZ-SS
                </Text> */}
                <Link to="/">
                  <div className={classes.logo} aria-label="RFlowZ Logo" />
                </Link>

                <Text size="xs" c="dimmed">
                  From Researcher to Researcher
                </Text>
              </Group>

              <Group gap="sm">
                <Menu
                  shadow="md"
                  width={200}
                  position="bottom-end"
                  withArrow
                  arrowPosition="center"
                  offset={5}
                >
                  <Menu.Target>
                    {/* <Avatar
                      alt={user?.name}
                      size="md"
                      color="red"
                      variant="light"
                    >
                      FW
                    </Avatar> */}
                    <NavbarAvatar username={user?.name || ""} />
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Group gap={8} justify="space-between" p={5}>
                      <Group gap={6}>
                        <Stack gap={1}>
                          <Text size="sm" truncate>
                            {user?.name}
                          </Text>
                          <Text size="xs" c="dimmed" truncate>
                            {user?.email}
                          </Text>
                        </Stack>
                      </Group>
                    </Group>

                    <Menu.Divider />
                    <Menu.Item
                      component={Link}
                      to="/profile"
                      leftSection={
                        <Icon
                          name="user-circle-outline"
                          style={{ width: "20px", height: "20px" }}
                        />
                      }
                    >
                      Profile
                    </Menu.Item>

                    <Form method="post" action={"/logout"}>
                      <Menu.Item
                        type="submit"
                        leftSection={
                          isPending ? (
                            <Loader color="dark" size={rem(13)} />
                          ) : (
                            <Icon
                              name="logout-outline"
                              style={{ width: "20px", height: "20px" }}
                            />
                          )
                        }
                      >
                        Logout
                      </Menu.Item>
                    </Form>
                  </Menu.Dropdown>
                  <ThemeSwitch
                    userPreference={
                      rootData?.requestInfo.userPrefs.theme || null
                    }
                  />
                </Menu>
              </Group>
            </Group>
          </Container>
        </div>
      </AppShell.Header>

      <AppShell.Main>
        <Container>
          <Stack mt={10} w={"100%"} gap="xs">
            <div className={classes.breadcrumbContainer}>
              <BreadcrumbsComponent />
            </div>
            <div className={classes.outletContainer}>{children}</div>
            <div className={classes.disclaimerContainer}>
              <Spoiler
                maxHeight={37}
                showLabel="Show more"
                hideLabel="Hide"
                classNames={{ control: classes.spoilerControl }}
              >
                <Text size="xs" c="dimmed">
                  RFlowZ is designed to assist users in developing research
                  proposals by utilizing the principles of the Design Science
                  Research (DSR) approach. While the software provides
                  structured guidance and tools aligned with DSR methodologies,
                  it is important to note that RFlowZ serves as a supportive aid
                  and not a substitute for a researcher&apos;s expertise,
                  judgment, or comprehensive understanding of the DSR approach.
                  Users are responsible for ensuring that their research
                  complies with the ethical standards, guidelines, and
                  requirements set by their respective institutions, funding
                  bodies, or governing authorities. The recommendations and
                  templates provided by RFlowZ are intended for general use and
                  may require modification to meet specific academic or
                  professional contexts. The creators of RFlowZ do not guarantee
                  the acceptance, approval, or success of any research proposal
                  generated using the software, as outcomes are dependent on the
                  quality of the content provided by users and the standards of
                  external evaluators. By using RFlowZ, users acknowledge that
                  they remain solely responsible for the final content,
                  integrity, and validity of their research proposals.
                </Text>
              </Spoiler>
            </div>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
