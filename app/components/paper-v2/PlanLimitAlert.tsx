import { Alert, Button } from "@mantine/core";
import { Link } from "@remix-run/react";

type PlanLimitAlertProps = {
  message?: string | null;
  planLimit?: boolean;
  title?: string;
};

export function PlanLimitAlert({
  message,
  planLimit,
  title,
}: PlanLimitAlertProps) {
  if (!message) return null;

  const resolvedTitle =
    title ?? (planLimit ? "AI limit reached" : "Ask Prof Z failed");

  return (
    <Alert
      color={planLimit ? "orange" : "red"}
      title={resolvedTitle}
      variant="light"
    >
      <p style={{ margin: 0 }}>{message}</p>
      {planLimit ? (
        <Button
          component={Link}
          to="/subscription"
          size="xs"
          mt="sm"
          variant="light"
        >
          Upgrade plan
        </Button>
      ) : null}
    </Alert>
  );
}
