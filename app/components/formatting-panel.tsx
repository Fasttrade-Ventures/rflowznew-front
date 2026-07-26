import { FormattingPreferences } from "#app/services/formatting.server";
import {
  Badge,
  Button,
  Collapse,
  Divider,
  Grid,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Icon } from "./icon";

const FONT_FAMILIES = [
  "Calibri",
  "Times New Roman",
  "Arial",
  "Georgia",
  "Cambria",
];

const CITATION_PREVIEWS: Record<string, string> = {
  apa: "Doe, J., & Smith, J. (2023). Urban farming at scale. Journal of Urban Studies. https://doi.org/10.1000/xyz",
  mla: 'Doe, John, and Jane Smith. "Urban Farming at Scale." Journal of Urban Studies, 2023, doi:10.1000/xyz',
  chicago:
    'Doe, John, and Jane Smith. 2023. "Urban Farming at Scale." Journal of Urban Studies. https://doi.org/10.1000/xyz',
  harvard:
    "Doe, J. and Smith, J. (2023) 'Urban farming at scale', Journal of Urban Studies. doi: 10.1000/xyz",
  ieee: 'J. Doe and J. Smith, "Urban farming at scale," Journal of Urban Studies, 2023. doi: 10.1000/xyz',
};

export function FormattingPanel({
  preferences,
  isCustomized,
}: {
  preferences: FormattingPreferences;
  isCustomized: boolean;
}) {
  const [opened, { toggle }] = useDisclosure(false);
  const [prefs, setPrefs] = useState<FormattingPreferences>(preferences);
  const fetcher = useFetcher<{ message?: string }>();
  const isSaving = fetcher.state !== "idle";

  useEffect(() => {
    setPrefs(preferences);
  }, [preferences]);

  const set = <K extends keyof FormattingPreferences>(
    key: K,
    value: FormattingPreferences[K]
  ) => setPrefs((current) => ({ ...current, [key]: value }));

  const handleSave = () => {
    fetcher.submit(
      { intent: "save-formatting", preferences: JSON.stringify(prefs) },
      { method: "post" }
    );
  };

  const handleReset = () => {
    fetcher.submit({ intent: "reset-formatting" }, { method: "post" });
  };

  return (
    <Paper withBorder radius="md" p="md">
      <UnstyledButton onClick={toggle} w="100%">
        <Group justify="space-between">
          <Group gap="xs">
            <Icon name="settings-outline" style={{ width: 18, height: 18 }} />
            <Text fw={600}>Document formatting</Text>
            {isCustomized && (
              <Badge size="xs" variant="light">
                Customized
              </Badge>
            )}
          </Group>
          <Icon
            name="chevron-down-outline"
            style={{
              width: 16,
              height: 16,
              transform: opened ? "rotate(180deg)" : undefined,
              transition: "transform 150ms ease",
            }}
          />
        </Group>
      </UnstyledButton>

      <Collapse in={opened}>
        <Stack gap="md" mt="md">
          <Divider label="Typography" labelPosition="left" />
          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select
                label="Font"
                data={FONT_FAMILIES}
                value={prefs.font_family}
                onChange={(value) => value && set("font_family", value)}
                allowDeselect={false}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select
                label="Font size"
                data={["10", "11", "12", "13", "14"]}
                value={String(prefs.font_size)}
                onChange={(value) => value && set("font_size", Number(value))}
                allowDeselect={false}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Stack gap={4}>
                <Text size="sm" fw={500}>
                  Line spacing
                </Text>
                <SegmentedControl
                  fullWidth
                  data={[
                    { label: "1.0", value: "1" },
                    { label: "1.15", value: "1.15" },
                    { label: "1.5", value: "1.5" },
                    { label: "2.0", value: "2" },
                  ]}
                  value={String(prefs.line_spacing)}
                  onChange={(value) => set("line_spacing", Number(value))}
                />
              </Stack>
            </Grid.Col>
          </Grid>

          <Divider label="Layout" labelPosition="left" />
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Margins
            </Text>
            <SegmentedControl
              data={[
                { label: 'Normal (1")', value: "normal" },
                { label: 'Narrow (0.5")', value: "narrow" },
                { label: "Wide", value: "wide" },
                { label: "Custom", value: "custom" },
              ]}
              value={prefs.margin_preset}
              onChange={(value) =>
                set(
                  "margin_preset",
                  value as FormattingPreferences["margin_preset"]
                )
              }
            />
          </Stack>
          {prefs.margin_preset === "custom" && (
            <Grid>
              {(
                [
                  ["margin_top", "Top"],
                  ["margin_right", "Right"],
                  ["margin_bottom", "Bottom"],
                  ["margin_left", "Left"],
                ] as const
              ).map(([key, label]) => (
                <Grid.Col span={{ base: 6, sm: 3 }} key={key}>
                  <NumberInput
                    label={`${label} (inches)`}
                    min={0.25}
                    max={2}
                    step={0.25}
                    decimalScale={2}
                    value={(prefs[key] ?? 1440) / 1440}
                    onChange={(value) =>
                      set(key, Math.round(Number(value || 1) * 1440))
                    }
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}

          <Group grow align="flex-start">
            <Stack gap="xs">
              <Switch
                label="Header"
                checked={prefs.header_enabled}
                onChange={(event) =>
                  set("header_enabled", event.currentTarget.checked)
                }
              />
              {prefs.header_enabled && (
                <TextInput
                  placeholder="Leave empty to use paper title"
                  value={prefs.header_text ?? ""}
                  onChange={(event) =>
                    set("header_text", event.currentTarget.value || null)
                  }
                  maxLength={150}
                />
              )}
            </Stack>
            <Stack gap="xs">
              <Switch
                label="Footer"
                checked={prefs.footer_enabled}
                onChange={(event) =>
                  set("footer_enabled", event.currentTarget.checked)
                }
              />
              {prefs.footer_enabled && (
                <TextInput
                  placeholder="Footer text"
                  value={prefs.footer_text ?? ""}
                  onChange={(event) =>
                    set("footer_text", event.currentTarget.value || null)
                  }
                  maxLength={150}
                />
              )}
            </Stack>
            <Stack gap="xs">
              <Switch
                label="Page numbers"
                checked={prefs.page_number_enabled}
                onChange={(event) =>
                  set("page_number_enabled", event.currentTarget.checked)
                }
              />
              {prefs.page_number_enabled && (
                <Select
                  data={[
                    { label: "Footer, centered", value: "footer_center" },
                    { label: "Footer, right", value: "footer_right" },
                    { label: "Header, right", value: "header_right" },
                  ]}
                  value={prefs.page_number_position}
                  onChange={(value) =>
                    value &&
                    set(
                      "page_number_position",
                      value as FormattingPreferences["page_number_position"]
                    )
                  }
                  allowDeselect={false}
                />
              )}
            </Stack>
          </Group>

          <Divider label="Citation" labelPosition="left" />
          <Grid align="flex-end">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select
                label="Citation style"
                data={[
                  { label: "APA (7th edition)", value: "apa" },
                  { label: "MLA (9th edition)", value: "mla" },
                  { label: "Chicago (author-date)", value: "chicago" },
                  { label: "Harvard", value: "harvard" },
                  { label: "IEEE", value: "ieee" },
                ]}
                value={prefs.citation_style}
                onChange={(value) =>
                  value &&
                  set(
                    "citation_style",
                    value as FormattingPreferences["citation_style"]
                  )
                }
                allowDeselect={false}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <Text size="xs" c="dimmed" fs="italic">
                {CITATION_PREVIEWS[prefs.citation_style]}
              </Text>
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button
              variant="subtle"
              color="gray"
              onClick={handleReset}
              loading={isSaving}
            >
              Reset to default
            </Button>
            <Button onClick={handleSave} loading={isSaving}>
              Save formatting
            </Button>
          </Group>
          {fetcher.data?.message && (
            <Text size="sm" c="var(--mantine-primary-color-filled)" ta="right">
              {fetcher.data.message}
            </Text>
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
}
