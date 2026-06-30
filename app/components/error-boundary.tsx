import {
  type ErrorResponse,
  isRouteErrorResponse,
  useParams,
  useRouteError,
} from "@remix-run/react";
import { getErrorMessage } from "#app/utils/misc.tsx";
import { Container, Text, Stack, Code, Title } from "@mantine/core";

type StatusHandler = (info: {
  error: ErrorResponse;
  params: Record<string, string | undefined>;
}) => JSX.Element | null;

export function GeneralErrorBoundary({
  defaultStatusHandler = ({ error }) => {
    return (
      <Stack gap="md">
        <Title order={2} c="red">
          {error.status} Error
        </Title>
        <Text size="lg" fw={500}>
          {JSON.stringify(error?.data, null, 2) ||
            error?.data?.message ||
            error?.statusText}
        </Text>
        {error?.data?.stack && process.env.NODE_ENV === "development" && (
          <Code block color="var(--mantine-color-blue-light)">
            {error.data.stack}
          </Code>
        )}
      </Stack>
    );
  },
  statusHandlers,
  unexpectedErrorHandler = (error) => (
    <Stack gap="md">
      <Title order={4} c="red">
        An unexpected error occurred
      </Title>
      <Text size="sm" fw={500}>
        {getErrorMessage(error)}
      </Text>
      {error instanceof Error &&
        error.stack &&
        process.env.NODE_ENV === "development" && (
          <Code block color="var(--mantine-color-red-light)">
            {error.stack}
          </Code>
        )}
    </Stack>
  ),
}: {
  defaultStatusHandler?: StatusHandler;
  statusHandlers?: Record<number, StatusHandler>;
  unexpectedErrorHandler?: (error: unknown) => JSX.Element | null;
}) {
  const error = useRouteError();
  const params = useParams();

  if (typeof document !== "undefined") {
    console.error(error);
  }

  return (
    <Container size="md" py="xl">
      {isRouteErrorResponse(error)
        ? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
            error,
            params,
          })
        : unexpectedErrorHandler(error)}
    </Container>
  );
}
