import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";
import {
  getPaperExperimentAnalysis,
  getPaperExpertReview,
} from "#app/services/paper.server";
import { getHints } from "#app/utils/client-hints";
import { redirectWithToast } from "#app/utils/toast.server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { invariant } from "@epic-web/invariant";
import {
  Button,
  Group,
  Stack,
  Text,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { FormattedText } from "#app/components/ui/FormattedText";

dayjs.extend(utc);
dayjs.extend(timezone);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");
  try {
    const res = await getPaperExperimentAnalysis({ paperId, request });
    if (res.data?.message === "No experiment analysis found for this paper") {
      return redirect(`/paper/${paperId}/experiment-analysis/form`);
    }
    return json({ ...res.data, timeZone: getHints(request).timeZone });
  } catch (error) {
    return redirectWithToast("/paper", {
      type: "error",
      title: "Paper not found",
      description: "Paper not found",
    });
  }
};

export const ExpertReviewPage = () => {
  const data = useLoaderData<typeof loader>();
  const formatDate = (date: string) => {
    return dayjs(date).tz(data.timeZone).format("DD/MM/YYYY HH:mm");
  };
  const createdAt = formatDate(data?.experiment_analysis?.created_at!);
  const updatedAt =
    data?.experiment_analysis?.updated_at ===
    data?.experiment_analysis?.created_at
      ? "-"
      : formatDate(data?.experiment_analysis?.updated_at!);

  const formattedBody = data?.experiment_analysis
    ?.body!.replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  return (
    <Stack>
      <Stack pr="md" pl="md">
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={4}>Experiment Analysis</Title>
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
            to={`/paper/${data?.experiment_analysis?.paper_id}/experiment-analysis/form`}
          >
            Edit
          </Button>
        </Group>
      </Stack>
      <CDivider />
      <Stack pr="md" pl="md">
        <FormattedText content={data?.experiment_analysis?.body!} />
      </Stack>
    </Stack>
  );
};

export default ExpertReviewPage;
