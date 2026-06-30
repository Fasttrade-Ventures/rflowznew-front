import {
  getCurrentUser,
  requireAuth,
} from "#app/services/authentication.server";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { Box, Flex, Progress, SimpleGrid, Text } from "@mantine/core";
import { Icon } from "#app/components/icon";

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
  const papers = res.data?.papers;

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

    return json({ user: userRes.data, papers });
  }

  return json({ papers, user: userRes.data });
};

export default function Index() {
  const { papers } = useLoaderData<typeof loader>();

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
                to={`/paper/${paper.id}/introduction`}
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
