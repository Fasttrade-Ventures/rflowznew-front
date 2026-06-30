import { getPaperBibliography } from "#app/services/paper.server";
import { invariant } from "@epic-web/invariant";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Box, Text, List, Alert, Stack, Title, Group } from "@mantine/core";
import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { paperId } = params;
  invariant(paperId, "paperId is required");
  const res = await getPaperBibliography({ paperId, request });

  return json({ bibliography: res.data?.bibliography });
};

export const ReferencePage = () => {
  const { bibliography } = useLoaderData<typeof loader>();

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
    </Stack>
  );
};

export default ReferencePage;
