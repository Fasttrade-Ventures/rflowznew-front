import { Button, Text, Stack, Box, Center } from "@mantine/core";
import classes from "./NoSubscriptionEmptyState.module.css";
import { Link } from "@remix-run/react";
import { Icon } from "./icon";

export const NoSubscriptionEmptyState = () => {
  return (
    <Box className={classes.container}>
      <Box className={classes.card}>
        <Center>
          <Stack align="center" gap="xl">
            <Stack align="center" gap="xs">
              <Icon
                name="pika-support"
                style={{ width: 40, height: 40 }}
                color="var(--mantine-primary-color-5)"
              />
              <Text size="xl" fw={700} ta="center">
                No Active Subscription
              </Text>
              <Text c="dimmed" ta="center" size="sm">
                You currently don&apos;t have an active subscription. Subscribe now
                to access all features!
              </Text>
            </Stack>
            <Button component={Link} to="/subscription" size="sm">
              Subscribe now
            </Button>
          </Stack>
        </Center>
      </Box>
    </Box>
  );
};

export default NoSubscriptionEmptyState;
