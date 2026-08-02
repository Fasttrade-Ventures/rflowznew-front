import { APIValidationError } from "#app/utils/error/api-validation-error";
import { notifications } from "@mantine/notifications";

const DEFAULT_AI_ERROR = "Error generating AI response";

/** Extract a user-facing message from API / Remix action failures. */
export function getApiErrorMessage(
  error: unknown,
  fallback = DEFAULT_AI_ERROR
): string {
  if (error instanceof APIValidationError) {
    const message = error.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (
    error &&
    typeof error === "object" &&
    "cause" in error &&
    error.cause &&
    typeof error.cause === "object" &&
    "data" in error.cause
  ) {
    const message = (error.cause as { data?: { message?: string } }).data
      ?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function isPlanLimitError(error: unknown): boolean {
  if (!(error instanceof APIValidationError)) return false;
  return (
    error.status === 402 || error.data?.error === "plan_limit_exceeded"
  );
}

export function getAskProfZErrorTitle(error: unknown): string {
  return isPlanLimitError(error) ? "AI limit reached" : "Ask Prof Z";
}

export function showAskProfZNotification({
  message,
  planLimit,
  title,
}: {
  message: string;
  planLimit?: boolean;
  title?: string;
}) {
  notifications.show({
    title: title ?? (planLimit ? "AI limit reached" : "Ask Prof Z"),
    message,
    color: planLimit ? "orange" : "red",
    autoClose: planLimit ? 12_000 : 6_000,
  });
}
