import { Icon } from "#app/components/icon";
import { getPaperPointOfDeparture } from "#app/services/paper.server";
import { getHints } from "#app/utils/client-hints";
import { redirectWithToast } from "#app/utils/toast.server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { invariant } from "@epic-web/invariant";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { CDivider } from "#app/components/ui/CDivider";
import { FormattedText } from "#app/components/ui/FormattedText";

dayjs.extend(utc);
dayjs.extend(timezone);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperPointOfDeparture({ paperId, request });
    if (res.data?.message === "No Point of Departure found for this paper") {
      return redirect(`/paper/${paperId}/point-of-departure/form`);
    }
    console.log(res.data);
    return json({ ...res.data, timeZone: getHints(request).timeZone });
  } catch (error) {
    return redirectWithToast("/paper", {
      type: "error",
      title: "Paper not found",
      description: "Paper not found",
    });
  }
};

export const PointOfDeparturePage = () => {
  const data = useLoaderData<typeof loader>();
  console.log("data", data);
  const formatDate = (date: string) => {
    return dayjs(date).tz(data.timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = formatDate(data?.point_of_departure?.created_at!);
  const updatedAt =
    data?.point_of_departure?.updated_at ===
    data?.point_of_departure?.created_at
      ? "-"
      : formatDate(data?.point_of_departure?.updated_at!);
  return (
    <Stack>
      <Stack pr="md" pl="md">
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={4}>Point of Departure</Title>
            <Group>
              <Text size="xs" c="dimmed">
                Created: {createdAt}
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {updatedAt}
              </Text>
            </Group>
          </Stack>
          <Button
            leftSection={
              <Icon name="pencil-outline" style={{ width: 16, height: 16 }} />
            }
            variant="light"
            component={Link}
            to={`/paper/${data?.point_of_departure?.paper_id}/point-of-departure/form`}
          >
            Edit
          </Button>
        </Group>
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <FormattedText content={data?.point_of_departure?.body!} />
      </Stack>
    </Stack>
  );
};

export default PointOfDeparturePage;
