import { Text, Stack, Center } from "@mantine/core";
import { Icon } from "#app/components/icon";
import classes from "./MendeleyCitationEmptyState.module.css";

export const MendeleyCitationEmptyState = () => {
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
              No results found in Mendeley
            </Text>
          </Center>
          <Center>
            <Text size="sm">
              Please enter the keywords you want to search for
            </Text>
          </Center>
        </Stack>
      </Stack>
    </div>
  );
};
