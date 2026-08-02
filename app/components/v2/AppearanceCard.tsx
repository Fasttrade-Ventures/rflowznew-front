import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";
import { V2Card } from "#app/components/v2/V2UIKit";
import {
  FONT_SCALE_MARKS,
  THEME_COLORS,
  type FontScale,
} from "#app/utils/appearance";
import { useRequestInfo } from "#app/utils/request-info";
import type { Theme } from "#app/utils/theme.server";
import {
  ThemeSwitch,
  useOptimisticThemeMode,
} from "#app/routes/resources+/theme-switch";
import { Box, Button, Group, SegmentedControl, Slider, Text } from "@mantine/core";
import { useFetcher, useRevalidator } from "@remix-run/react";
import { useEffect, useMemo } from "react";

import legacyClasses from "#app/routes/profile+/profile.module.css";

type AppearanceCardProps = {
  userId?: number;
  colorTheme?: string | null;
  fontScale?: FontScale | null;
  variant?: "v2" | "legacy";
};

type ProfileAppearanceAction = {
  color?: string;
  scale?: FontScale;
};

function ColorSchemePicker({
  userPreference,
}: {
  userPreference?: Theme | null;
}) {
  const fetcher = useFetcher();
  const optimisticMode = useOptimisticThemeMode();
  const mode = optimisticMode ?? userPreference ?? "system";

  const setMode = (next: "light" | "dark" | "system") => {
    const formData = new FormData();
    formData.set("theme", next);
    fetcher.submit(formData, {
      method: "post",
      action: "/resources/theme-switch",
    });
  };

  return (
    <SegmentedControl
      size="xs"
      value={mode}
      onChange={(value) => setMode(value as "light" | "dark" | "system")}
      data={[
        {
          value: "light",
          label: (
            <Group gap={4} wrap="nowrap">
              <Icon name="sun" style={{ width: 14, height: 14 }} />
              <span>Light</span>
            </Group>
          ),
        },
        {
          value: "dark",
          label: (
            <Group gap={4} wrap="nowrap">
              <Icon name="moon" style={{ width: 14, height: 14 }} />
              <span>Dark</span>
            </Group>
          ),
        },
        {
          value: "system",
          label: (
            <Group gap={4} wrap="nowrap">
              <Icon name="laptop" style={{ width: 14, height: 14 }} />
              <span>System</span>
            </Group>
          ),
        },
      ]}
    />
  );
}

export function AppearanceCard({
  userId,
  colorTheme,
  fontScale,
  variant = "v2",
}: AppearanceCardProps) {
  const profileFetcher = useFetcher<ProfileAppearanceAction>();
  const { revalidate } = useRevalidator();
  const requestInfo = useRequestInfo();
  const scaleIndex = useMemo(
    () =>
      Math.max(
        0,
        FONT_SCALE_MARKS.findIndex((mark) => mark.label === (fontScale ?? "md"))
      ),
    [fontScale]
  );

  useEffect(() => {
    if (profileFetcher.state === "idle" && profileFetcher.data) {
      revalidate();
    }
  }, [profileFetcher.state, profileFetcher.data, revalidate]);

  const handleThemeChange = (color: string) => {
    if (!userId) return;
    const formData = new FormData();
    formData.append("color", color);
    formData.append("actionType", "color-switch");
    formData.append("userId", String(userId));
    profileFetcher.submit(formData, { method: "post" });
  };

  const handleScaleChange = (value: number) => {
    if (!userId) return;
    const scale = FONT_SCALE_MARKS[value / 25]?.label ?? "md";
    const formData = new FormData();
    formData.append("scale", scale);
    formData.append("actionType", "scale-switch");
    formData.append("userId", String(userId));
    profileFetcher.submit(formData, { method: "post" });
  };

  const content = (
    <>
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm" fw={600}>
          Color mode
        </Text>
        <ColorSchemePicker userPreference={requestInfo.userPrefs.theme} />
      </Group>

      <CDivider darkColor="var(--rz-border)" />

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm" fw={600}>
          Accent color
        </Text>
        <Button.Group>
          {THEME_COLORS.map((color) => (
            <Button
              key={color}
              variant="default"
              className={legacyClasses.themeButton}
              mod={colorTheme === color ? "selected" : undefined}
              onClick={() => handleThemeChange(color)}
              aria-label={`${color} accent`}
              aria-pressed={colorTheme === color}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: `var(--mantine-color-${color}-5)`,
                }}
              />
            </Button>
          ))}
        </Button.Group>
      </Group>

      <CDivider darkColor="var(--rz-border)" />

      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Text size="sm" fw={600}>
          Font size
        </Text>
        <Box style={{ flex: 1, minWidth: 140, maxWidth: "100%" }}>
          <Slider
            key={fontScale ?? "md"}
            defaultValue={scaleIndex * 25}
            label={(val) => FONT_SCALE_MARKS.find((mark) => mark.value === val)!.label}
            step={25}
            marks={FONT_SCALE_MARKS}
            styles={{ markLabel: { display: "none" } }}
            onChangeEnd={handleScaleChange}
          />
        </Box>
      </Group>

      <Text size="xs" c="dimmed" mt={4}>
        Color mode is saved in this browser. Accent color and font size are saved
        to your account and apply everywhere you sign in.
      </Text>
    </>
  );

  if (variant === "legacy") {
    return <>{content}</>;
  }

  return (
    <V2Card title="Appearance" subtitle="Color mode, accent, and font size">
      {content}
    </V2Card>
  );
}

/** Compact header toggle — keeps existing nav behavior. */
export function HeaderThemeSwitch({
  userPreference,
}: {
  userPreference?: Theme | null;
}) {
  return <ThemeSwitch userPreference={userPreference} />;
}
