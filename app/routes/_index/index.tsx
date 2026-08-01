import {
  getCurrentUser,
  requireAuth,
} from "#app/services/authentication.server";
import { getLibraryEntries } from "#app/services/library.server";
import type { LibraryEntry } from "#app/services/library.server";
import { getCurrentUserSubscription } from "#app/services/subscription.server";
import {
  buildDashboardActivity,
  computeDashboardStats,
} from "#app/utils/home-dashboard";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { z } from "zod";
import { Box, Flex, Progress, SimpleGrid, Text } from "@mantine/core";
import { Icon } from "#app/components/icon";
import { HomeDashboardV2 } from "#app/components/v2/HomeDashboardV2";
import { loader as rootLoader } from "#app/root";

import classes from "./index.module.css";
import { getPapers } from "#app/services/paper.server";
import { updateUserSubscriptionStatus } from "#app/services/auth.server";
import { redirectWithToast } from "#app/utils/toast.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Rflowz - From Researcher to Researcher" },
    {
      name: "description",
      content:
        "Rflowz is a research assistant that helps you write your research paper.",
    },
  ];
};

export const BreadcrumbHandle = z.object({
  breadcrumb: z.any(),
  icon: z.any(),
  dynamicBreadcrumb: z.any(),
});
export type BreadcrumbHandle = z.infer<typeof BreadcrumbHandle>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });

  const userRes = await getCurrentUser({ request });

  const res = await getPapers({ request });
  const papers = res.data?.papers ?? [];

  const [libraryResults, subscriptionRes] = await Promise.all([
    Promise.all(
      papers.map(async (paper) => {
        const libraryRes = await getLibraryEntries({
          request,
          paperId: String(paper.id),
        });
        return libraryRes.data?.entries ?? [];
      })
    ),
    getCurrentUserSubscription({ request }),
  ]);

  const libraryEntries: LibraryEntry[] = libraryResults.flat();
  const stats = computeDashboardStats({
    papers,
    libraryEntries,
    subscription: subscriptionRes.data?.subscription,
    features: subscriptionRes.data?.features,
  });
  const activity = buildDashboardActivity(papers, libraryEntries);

  if (user.subscription_status !== userRes.data?.subscription_status ||
    user.plan_key !== userRes.data?.plan_key) {
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
          description: "Your subscription status has been update.",
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
      papers,
      stats,
      activity,
    });
  }

  return json({
    papers,
    user: userRes.data,
    stats,
    activity,
  });
};

export default function Index() {
  const { papers, user, stats, activity } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<typeof rootLoader>("root");

  if (rootData?.paperV2Flow) {
    return (
      <HomeDashboardV2
        papers={papers}
        stats={stats}
        activity={activity}
        userName={user?.name}
        userEmail={user?.email}
      />
    );
  }

  return (
    <>
      <Flex wrap="wrap" gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          <Box className={classes.flexItem}>
            <Link to="/paper/new" className={classes.boxLink}>
              <div className={`${classes.box} ${classes.hoverEffect}`}>
                <div className={classes.borderBox}>
                  <div className={classes.iconBox}>
                    <Icon
                      name="plus-outline"
                      width={22}
                      height={22}
                      className={classes.icon}
                    />
                  </div>
                </div>
                <div className={classes.textBox}>
                  <Text fw={600} size="md">
                    Create new Project
                  </Text>
                  <Text size="xs" c="dimmed">
                    Create a new project and start writing your content.
                  </Text>
                </div>
              </div>
            </Link>
          </Box>
          {papers?.map((paper) => (
            <Box key={paper.id} className={classes.flexItem}>
              <Link
                to={`/paper/${paper.id}`}
                className={classes.boxLink}
              >
                <div className={`${classes.box} ${classes.hoverEffect}`}>
                  <div className={classes.borderBox}>
                    <div className={classes.iconBox}>
                      <Icon
                        name="plus-outline"
                        width={22}
                        height={22}
                        className={classes.icon}
                      />
                    </div>
                  </div>
                  <div className={classes.textBox}>
                    <Text fw={600} size="sm">
                      {paper.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Created: {new Date(paper.created_at).toLocaleDateString()}
                    </Text>
                  </div>
                  <Box w="100%" mt="auto">
                    {" "}
                    {/* Added mt="auto" to push it to the bottom */}
                    <Progress
                      value={paper.overall_progress}
                      color={
                        paper.overall_progress >= 100
                          ? "green"
                          : paper.overall_progress >= 50
                          ? "yellow"
                          : "red"
                      }
                    />
                  </Box>
                </div>
              </Link>
            </Box>
          ))}
        </SimpleGrid>
      </Flex>
    </>
  );
}
