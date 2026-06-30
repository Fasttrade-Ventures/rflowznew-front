import { useForm, getFormProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher, useFetchers } from "@remix-run/react";
import { z } from "zod";
import { useHints } from "#app/utils/client-hints.tsx";
import { useRequestInfo } from "#app/utils/request-info.ts";
import { Theme, setTheme } from "#app/utils/theme.server";
import { Icon } from "#app/components/icon";
import { ActionIcon } from "@mantine/core";
import classes from "./theme-switch.module.css";

const ThemeFormSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: ThemeFormSchema,
  });

  console.log(submission.payload);

  if (submission.status !== "success") {
    return json({ result: submission.reply() }, { status: 400 });
  }

  const { theme } = submission.value || {};
  if (!theme) {
    console.log("No theme received");
  }
  const responseInit = {
    headers: { "set-cookie": setTheme(theme) },
  };
  return json({ result: submission.reply() }, responseInit);
}

export function ThemeSwitch({
  userPreference,
}: {
  userPreference?: Theme | null;
}) {
  const fetcher = useFetcher<typeof action>();

  const [form] = useForm({
    id: "theme-switch",
    lastResult: fetcher.data?.result,
  });

  const optimisticMode = useOptimisticThemeMode();
  const mode = optimisticMode ?? userPreference ?? "system";
  const nextMode =
    mode === "system" ? "light" : mode === "light" ? "dark" : "system";
  const modeLabel = {
    light: (
      <Icon name="sun" style={{ width: "15px", height: "15px" }}>
        <span className="sr-only">Light</span>
      </Icon>
    ),
    dark: (
      <Icon name="moon" style={{ width: "15px", height: "15px" }}>
        <span className="sr-only">Dark</span>
      </Icon>
    ),
    system: (
      <Icon name="laptop" style={{ width: "15px", height: "15px" }}>
        <span className="sr-only">System</span>
      </Icon>
    ),
  };

  return (
    <fetcher.Form
      method="POST"
      {...getFormProps(form)}
      action="/resources/theme-switch"
    >
      <input type="hidden" name="theme" value={nextMode} />
      <div className={classes.themeSwitch}>
        <ActionIcon size="sm" type="submit" variant="light">
          {modeLabel[mode]}
        </ActionIcon>
      </div>
    </fetcher.Form>
  );
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
  const fetchers = useFetchers();
  const themeFetcher = fetchers.find(
    (f) => f.formAction === "/resources/theme-switch"
  );

  if (themeFetcher && themeFetcher.formData) {
    const submission = parseWithZod(themeFetcher.formData, {
      schema: ThemeFormSchema,
    });

    if (submission.status === "success") {
      return submission.value.theme;
    }
  }
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
  const hints = useHints();
  const requestInfo = useRequestInfo();
  const optimisticMode = useOptimisticThemeMode();
  if (optimisticMode) {
    return optimisticMode === "system" ? hints.theme : optimisticMode;
  }
  return requestInfo.userPrefs.theme ?? hints.theme;
}
