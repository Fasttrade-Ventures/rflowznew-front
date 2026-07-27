import BreadcrumbsComponent from "#app/components/breadcrumbs/breadcrumbs";
import { GeneralErrorBoundary } from "#app/components/error-boundary";
import { Icon } from "#app/components/icon";
import NavbarAvatar from "#app/components/ui/NavbarAvatar";
import { IconName } from "#app/icons/types";
import { loader as rootLoader } from "#app/root.tsx";
import { BreadcrumbHandle } from "#app/routes/_index";
import { ThemeSwitch } from "#app/routes/resources+/theme-switch";
import { getPaper, getPaperProgress } from "#app/services/paper.server";
import { getHints } from "#app/utils/client-hints";
import { getLanguageDisplay } from "#app/utils/languages";
import { useIsPending } from "#app/utils/misc";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import React, { useEffect, useMemo } from "react";

import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Burger,
  Button,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Menu,
  NavLink,
  rem,
  RingProgress,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { json, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import {
  Form,
  Link,
  NavLink as RemixNavLink,
  Outlet,
  useLoaderData,
  useLocation,
  useParams,
  useRouteLoaderData,
} from "@remix-run/react";

import classes from "./layout.module.css";
import { CDivider } from "#app/components/ui/CDivider";

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
  dynamicBreadcrumb(data: SerializeFrom<typeof loader>) {
    return data.paper?.title?.substring(0, 20) + "...";
  },
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const paperId = params.paperId;

  try {
    const [paperRes, progressRes] = await Promise.all([
      getPaper({ paperId: paperId!, request }),
      getPaperProgress({ paperId: paperId!, request }),
    ]);

    const paper = paperRes.data?.paper;
    const progress = progressRes.data?.progress;

    return json({
      paper,
      progress,
      timeZone: getHints(request).timeZone,
    });
  } catch (error) {
    // Handle the error appropriately
    throw new Response("Error fetching paper data", { status: 500 });
  }
};

export default function PaperDetailLayout() {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const user = rootData?.user;
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();
  const params = useParams();
  const isPending = useIsPending();
  const data = useLoaderData<typeof loader>();

  const paperMethod = data?.paper?.method;

  const memoizedNavLinks = useMemo(() => {
    return renderNavLinks(
      navbarLink(params.paperId!, paperMethod!, data.progress!)
    );
  }, [params.paperId, paperMethod, data.progress]);

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  return (
    <AppShell
      layout="alt"
      navbar={{ width: 350, breakpoint: "lg", collapsed: { mobile: !opened } }}
      padding="md"
      className={classes.rootContainer}
    >
      <AppShell.Navbar p="md" className={classes.navbar}>
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Stack gap={0}>
            <Group wrap="nowrap" justify="space-between">
              <Burger
                opened={opened}
                onClick={toggle}
                size="sm"
                hiddenFrom="lg"
                classNames={{ root: classes.navbarBurger }}
              />

              <Button
                variant="light"
                size="compact-md"
                color="dark.1"
                component={Link}
                to="/"
              >
                <Icon
                  name="arrow-narrow-left-outline"
                  style={{ width: "20px", height: "20px" }}
                />
                <Text size="xs">Back to home</Text>
              </Button>
              <Group justify="flex-end">
                <Stack gap="xs" align="center">
                  <Link to="/">
                    <div className={classes.logo} aria-label="RFlowZ-SS Logo" />
                  </Link>
                </Stack>
              </Group>
            </Group>
            <CDivider my="xs" lightColor="var(--mantine-color-dark-8)" />

            <Stack gap={5} className={classes.navbarContent}>
              {memoizedNavLinks}
            </Stack>
          </Stack>
          <div style={{ marginTop: "auto" }}>
            <Group
              align="center"
              className={classes.navbarFooter}
              wrap="nowrap"
            >
              <NavbarAvatar username={user?.name ?? ""} />

              <div style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  {user?.name}
                </Text>

                <Text c="dimmed" size="xs">
                  {user?.email && user.email.length > 20
                    ? user.email.substring(0, 20) + "..."
                    : user?.email}
                </Text>
              </div>

              <Menu
                shadow="md"
                width={200}
                position="bottom-end"
                withArrow
                arrowPosition="center"
                offset={5}
              >
                <Menu.Target>
                  <ActionIcon variant="subtle" aria-label="Settings">
                    <Icon
                      name="chevron-right"
                      style={{
                        width: "25px",
                        height: "25px",
                      }}
                    />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Group gap={8} justify="space-between" p={5}>
                    <Group gap={6}>
                      <Stack gap={1}>
                        <Text size="sm" truncate>
                          {user?.name}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {user?.email && user.email.length > 20
                            ? user.email.substring(0, 24) + "..."
                            : user?.email}
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

                  <Menu.Item
                    component="div"
                    closeMenuOnClick={false}
                    leftSection={
                      <Icon
                        name="moon"
                        style={{ width: "18px", height: "18px" }}
                      />
                    }
                  >
                    <Group gap={5} justify="space-between">
                      Theme
                      <div>
                        <ThemeSwitch
                          userPreference={
                            rootData?.requestInfo.userPrefs.theme || null
                          }
                        />
                      </div>
                    </Group>
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
              </Menu>
            </Group>
          </div>
        </div>
      </AppShell.Navbar>
      <AppShell.Main className={classes.mainContainer}>
        <div className={classes.container}>
          <Group className={classes.breadcrumbsContainer} wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="lg"
              size="sm"
            />
            <div className={classes.breadcrumbs}>
              <BreadcrumbsComponent />
            </div>
          </Group>
          <div className={classes.paperHeaderContent}>
            <Grid align="center" gutter="xl">
              <Grid.Col span={{ base: 12, lg: 10 }}>
                <Stack gap="sm">
                  {data.paper?.keywords && data.paper?.keywords.length > 0 && (
                    <Group gap={5}>
                      {data.paper?.keywords.map((keyword) => (
                        <Badge variant="light" key={keyword} size="sm">
                          {keyword}
                        </Badge>
                      ))}
                    </Group>
                  )}
                  <Group gap="md">
                    <Group gap={2}>
                      <Text size="sm" lts={0.5} c="dimmed">
                        Tangible output:
                      </Text>
                      <Text size="sm" fw={500} c="dimmed">
                        {data.paper?.tangible_output}
                      </Text>
                    </Group>
                    <Group gap={2}>
                      <Text size="sm" lts={0.5} c="dimmed">
                        Method:
                      </Text>
                      <Text size="sm" fw={500} c="dimmed">
                        {data.paper?.method}
                      </Text>
                    </Group>
                    <Group gap={2}>
                      <Text size="sm" lts={0.5} c="dimmed">
                        Context:
                      </Text>
                      <Text size="sm" fw={500} c="dimmed">
                        {data.paper?.context}
                      </Text>
                    </Group>
                    <Group gap={2}>
                      <Text size="sm" lts={0.5} c="dimmed">
                        Language:
                      </Text>
                      <Text size="sm" fw={500} c="dimmed">
                        {getLanguageDisplay(data.paper?.language)}
                      </Text>
                    </Group>
                  </Group>
                  <Title order={4} textWrap="wrap">
                    {data.paper?.title}
                  </Title>
                  <Group gap="xs">
                    <Tooltip.Group openDelay={300} closeDelay={100}>
                      <Avatar.Group spacing="sm">
                        {data.paper?.authors.map((author, index) => (
                          <Tooltip
                            key={author.first_name + author.last_name + index}
                            label={author.first_name + " " + author.last_name}
                            withArrow
                          >
                            <Group gap={5}>
                              <NavbarAvatar
                                username={
                                  author.first_name + " " + author.last_name
                                }
                              />
                            </Group>
                          </Tooltip>
                        ))}
                      </Avatar.Group>
                    </Tooltip.Group>
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col
                span={{ base: 12, lg: "auto" }}
                style={{
                  display: "flex",
                }}
              >
                <Stack gap="xs" align="center">
                  <Button
                    size="xs"
                    variant="light"
                    component={Link}
                    to={`/paper/${params.paperId}/settings/edit`}
                  >
                    <Group gap={5} wrap="nowrap">
                      <Icon
                        name="info-circle-filled"
                        style={{ width: "20px", height: "20px" }}
                      />
                      <Text size="xs">More info</Text>
                    </Group>
                  </Button>
                </Stack>
              </Grid.Col>
            </Grid>
          </div>
          <Container className={classes.containerGrid} p={0}>
            <div className={classes.containerContent}>
              <Outlet />
            </div>
          </Container>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}

type NavbarLinkItem = {
  label: string;
  icon: IconName;
  type: "parent" | "child" | "standalone";
  link?: string;
  completion_percentage?: number;
  hidden?: boolean;
  children?: NavbarLinkItem[];
};

const navbarLink = (
  paperId: string,
  method: "Qualitative" | "Quantitative" | "Mixed",
  progress: {
    introduction: { completion_percentage: number };
    problem_statement: { completion_percentage: number };
    methodology: { completion_percentage: number };
    expected_output: { completion_percentage: number };
    conclusion: { completion_percentage: number };
    research_significant: { completion_percentage: number };
    solving_the_problem: { completion_percentage: number };
    abstract_sec: { completion_percentage: number };
    point_of_departure: { completion_percentage: number };
    research_question_and_objective: { completion_percentage: number };
    literature_review: { completion_percentage: number };
    experiment_analysis: { completion_percentage: number };
    expert_review: { completion_percentage: number };
    reliability: { completion_percentage: number };
    trustworthiness: { completion_percentage: number };
  }
): NavbarLinkItem[] => [
  {
    label: "Problems identification",
    icon: "pika-user-question-mark",
    type: "parent",
    children: [
      {
        link: `/paper/${paperId}/introduction`,
        label: "Background study",
        icon: "number-1-small-outline",
        type: "child",
        completion_percentage: progress?.introduction.completion_percentage,
      },
      {
        link: `/paper/${paperId}/problem-statement`,
        label: "Problem Statement",
        icon: "number-2-small-outline",
        type: "child",
        completion_percentage:
          progress?.problem_statement.completion_percentage,
      },
      {
        link: `/paper/${paperId}/point-of-departure`,
        label: "Point of Departure",
        icon: "number-3-small-outline",
        type: "child",
        completion_percentage:
          progress?.point_of_departure.completion_percentage,
      },
    ],
  },
  {
    label: "Defines objectives of a solution",
    icon: "pika-check",
    type: "parent",
    children: [
      {
        link: `/paper/${paperId}/research-questions-and-objectives`,
        label: "Questions and Objectives",
        icon: "number-4-small-outline",
        type: "child",
        completion_percentage:
          progress?.research_question_and_objective.completion_percentage,
      },
    ],
  },
  {
    label: "Design & Development",
    icon: "pika-pencil",
    type: "parent",
    children: [
      {
        link: `/paper/${paperId}/literature-review`,
        label: "Literature Review",
        icon: "number-5-small-outline",
        type: "child",
        completion_percentage:
          progress?.literature_review.completion_percentage,
      },
      {
        link: `/paper/${paperId}/methodology`,
        label: "Methodology",
        icon: "number-6-small-outline",
        type: "child",
        completion_percentage: progress?.methodology.completion_percentage,
      },
    ],
  },
  {
    label: "Demonstration",
    icon: "pika-spatial",
    type: "parent",
    children: [
      {
        link: `/paper/${paperId}/solving-the-problem`,
        label: "Solving the Problem",
        icon: "number-7-small-outline",
        type: "child",
        completion_percentage:
          progress?.solving_the_problem.completion_percentage,
      },
      {
        link: `/paper/${paperId}/research-significant`,
        label: "Research Significance",
        icon: "number-8-small-outline",
        type: "child",
        completion_percentage:
          progress?.research_significant.completion_percentage,
      },
    ],
  },
  {
    label: "Evaluation",
    icon: "pika-equals",
    type: "parent",
    children: [
      {
        link: `/paper/${paperId}/reliability`,
        label:
          method === "Quantitative"
            ? "Reliability"
            : method === "Qualitative"
            ? "Trustworthiness"
            : "Reliability & Trustworthiness",
        // icon: "number-3-small-outline",
        icon:
          method === "Qualitative"
            ? "number-9-small-outline"
            : "number-9-small-outline",

        type: "child",
        completion_percentage: progress?.reliability.completion_percentage,
      },
    ],
  },
  {
    link: `/paper/${paperId}/conclusion`,
    label: "Conclusion",
    icon: "pika-layer",
    type: "standalone",
    completion_percentage: progress?.conclusion.completion_percentage,
  },
  {
    link: `/paper/${paperId}/library`,
    label: "Library",
    icon: "pika-file-bolt",
    type: "standalone",
    completion_percentage: 0,
  },
  {
    link: `/paper/${paperId}/reference`,
    label: "Reference",
    icon: "pika-list",
    type: "standalone",
    completion_percentage: 0,
  },
  {
    link: `/paper/${paperId}/review-proposal`,
    label: "Review Proposal",
    icon: "pika-file",
    type: "standalone",
    completion_percentage: 0,
  },
];

// Optimize renderNavLinks function
const renderNavLinks = (items: NavbarLinkItem[]) => {
  return items.map((item) => {
    if (item.type === "standalone") {
      return <StandaloneLink key={item.label} item={item} />;
    }

    if (item.type === "parent") {
      return <ParentLink key={item.label} item={item} />;
    }
  });
};

// Create separate components for each link type
// eslint-disable-next-line react/prop-types
const StandaloneLink = React.memo(({ item }: { item: NavbarLinkItem }) => {
  return renderLink(item);
});
StandaloneLink.displayName = "StandaloneLink";

const ParentLink = React.memo(({ item }: { item: NavbarLinkItem }) => {
  const location = useLocation();
  const isActive = item.children?.some((child) =>
    location.pathname.startsWith(child.link!)
  );

  return (
    <NavLink
      key={item.label}
      defaultOpened={isActive}
      active={isActive}
      label={item.label}
      leftSection={
        <Icon name={item.icon} style={{ width: "24px", height: "24px" }} />
      }
      childrenOffset={28}
      classNames={{
        root: classes.navbarLinkRoot,
      }}
    >
      {item.children &&
        item.children.map((childItem) => {
          if (!childItem.hidden) {
            return <StandaloneLink key={childItem.label} item={childItem} />;
          }
        })}
    </NavLink>
  );
});
ParentLink.displayName = "ParentLink";

const renderLink = (item: NavbarLinkItem) => {
  return (
    <RemixNavLink
      to={item.link!}
      key={item.label}
      style={{ textDecoration: "none" }}
    >
      {({ isActive }) => (
        <span className={classes.link} data-active={isActive || undefined}>
          <Group justify="space-between" w="100%" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Icon className={classes.linkIcon} name={item.icon} />
              <span>{item.label}</span>
            </Group>
            {item.completion_percentage !== 0 &&
              item.completion_percentage !== 100 && (
                <RingProgress
                  classNames={{
                    root: classes.ringProgressRoot,
                    svg: classes.ringProgressSVG,
                  }}
                  size={32}
                  rootColor="dark.4"
                  thickness={2}
                  sections={[
                    {
                      value: item.completion_percentage ?? 0,
                      color: isActive ? "blue.3" : "blue.5",
                    },
                  ]}
                />
              )}
            {item.completion_percentage === 100 && (
              <Center>
                <ActionIcon
                  color={isActive ? "teal.9" : "teal.6"}
                  radius="xl"
                  size={27}
                  style={{ position: "absolute", right: 16 }}
                >
                  <Icon
                    name="check-outline"
                    style={{ width: rem(15), height: rem(15) }}
                  />
                </ActionIcon>
              </Center>
            )}
          </Group>
        </span>
      )}
    </RemixNavLink>
  );
};

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        403: ({ error }) => (
          <p>You are not allowed to do that: {error?.data}</p>
        ),
      }}
    />
  );
}
