import { Alert, Stack, Text } from "@mantine/core";

import type { CoherenceWarning } from "#app/services/coherence.server";

export function CoherenceWarningBanner({
  warnings,
}: {
  warnings: CoherenceWarning[];
}) {
  if (!warnings.length) return null;

  return (
    <Stack gap={6}>
      {warnings.map((w) => (
        <Alert
          key={w.code}
          color={w.severity === "error" ? "red" : w.severity === "warn" ? "yellow" : "blue"}
          title="Coherence check"
        >
          <Text size="sm">{w.message}</Text>
        </Alert>
      ))}
    </Stack>
  );
}
