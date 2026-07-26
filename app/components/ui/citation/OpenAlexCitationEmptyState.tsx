import { Text, Stack, Center } from "@mantine/core";
import { Icon } from "#app/components/icon";
import classes from "./MendeleyCitationEmptyState.module.css";

export const OpenAlexCitationEmptyState = () => {
  return (
    <div className={classes.emptyState}>
      <Stack align="center" justify="center" gap="md">
        <Icon
          name="pika-delete-paper"
          style={{
            width: "44px",
            height: "44px",
            color: "var(--mantine-color-gray-5)",
          }}
        />
        <Stack gap={5}>
          <Center>
            <Text size="sm" c="dimmed">
              No suggestions yet
            </Text>
          </Center>
          <Center>
            <Text size="sm">
              Fetch ranked academic sources based on this paper&apos;s topic
            </Text>
          </Center>
        </Stack>
      </Stack>
    </div>
  );
};
