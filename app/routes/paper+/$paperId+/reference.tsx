import {
  getCitationVerifications,
  getPaperBibliography,
} from "#app/services/paper.server";
import { invariant } from "@epic-web/invariant";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Box,
  Text,
  List,
  Alert,
  Stack,
  Title,
  Group,
  Badge,
} from "@mantine/core";
import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { paperId } = params;
  invariant(paperId, "paperId is required");
  const [bibliographyRes, verificationRes] = await Promise.all([
    getPaperBibliography({ paperId, request }),
    getCitationVerifications({
      paperId,
      section: "literature_review",
      request,
    }),
  ]);

  return json({
    bibliography: bibliographyRes.data?.bibliography,
    verification: verificationRes.data,
  });
};

const STATUS_BADGE: Record<
  string,
  { label: string; color: string }
> = {
  matched: { label: "Verified", color: "green" },
  unsupported: { label: "Unsupported claim", color: "orange" },
  unknown_source: { label: "Unknown source", color: "red" },
};

export const ReferencePage = () => {
  const { bibliography, verification } = useLoaderData<typeof loader>();

  return (
    <Stack>
      <Stack pr="md" pl="md">
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={4}>References</Title>
          </Stack>
        </Group>
      </Stack>
      <CDivider />
      <Box p="md">
        {bibliography && bibliography.length > 0 ? (
          <List spacing="xs" size="sm" mb="xs">
            {bibliography.map((reference, index) => (
              <List.Item key={index}>{reference}</List.Item>
            ))}
          </List>
        ) : (
          <Alert
            icon={
              <Icon
                name="x-outline"
                style={{ width: "1rem", height: "1rem" }}
              />
            }
            title="No references"
            color="yellow"
          >
            Please add citations to generate references.
          </Alert>
        )}
      </Box>

      {verification && verification.status !== "not_started" && (
        <>
          <CDivider />
          <Box p="md">
            <Title order={5} mb="sm">
              Citation verification
            </Title>
            {verification.status === "pending" && (
              <Text size="sm" c="dimmed">
                Verification is running against the literature review — check
                back shortly.
              </Text>
            )}
            {verification.status === "failed" && (
              <Text size="sm" c="dimmed">
                Verification could not be completed. Try again later.
              </Text>
            )}
            {verification.status === "completed" && verification.results && (
              <Stack gap="xs">
                {verification.results.citations.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No in-text citation markers were found to verify.
                  </Text>
                ) : (
                  verification.results.citations.map((c, index) => {
                    const badge = STATUS_BADGE[c.status] ?? {
                      label: c.status,
                      color: "gray",
                    };
                    return (
                      <Group key={index} justify="space-between">
                        <Text size="sm">{c.span}</Text>
                        <Badge size="sm" color={badge.color}>
                          {badge.label}
                        </Badge>
                      </Group>
                    );
                  })
                )}
              </Stack>
            )}
          </Box>
        </>
      )}
    </Stack>
  );
};

export default ReferencePage;
