import { Icon } from "#app/components/icon";
import type { LibraryEntry } from "#app/services/library.server";
import { useCitationStore } from "#app/stores/citationStore";
import { generateReference } from "#app/utils/generateReference";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useFetcher } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";

type LibraryListResponse = {
  success?: boolean;
  entries?: LibraryEntry[];
};

/**
 * Pick cites from the paper's saved library (unified citation pool).
 * Selection goes into the same selectedCites list as Search / Manual.
 */
export function LibraryCitePicker({ paperId }: { paperId: string }) {
  const fetcher = useFetcher<LibraryListResponse>();
  const { addSelectedCite, removeSelectedCite, citeFormState } =
    useCitationStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetcher.load(`/resources/library-entries?paperId=${paperId}`);
    // Load once per paperId when the Library tab mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  const entries = fetcher.data?.entries ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.source ?? "").toLowerCase().includes(q) ||
        String(e.year ?? "").includes(q)
    );
  }, [entries, query]);

  const isSelected = (entry: LibraryEntry) =>
    citeFormState.selectedCites.some((c) => {
      if (entry.openalex_id && c.openalex_id === entry.openalex_id) return true;
      return (
        c.title === entry.title &&
        String(c.year) === String(entry.year ?? entry.cite?.year ?? "")
      );
    });

  const toCite = (entry: LibraryEntry) => {
    if (entry.kind === "academic" && entry.cite) {
      return {
        source: entry.cite.source ?? entry.source ?? "",
        title: entry.cite.title ?? entry.title,
        year: String(entry.cite.year ?? entry.year ?? ""),
        doi: entry.cite.doi ?? undefined,
        authors: (entry.cite.authors ?? []).map((a) => ({
          first_name: a.first_name ?? "",
          last_name: a.last_name ?? "",
        })),
        openalex_id: entry.cite.openalex_id ?? entry.openalex_id ?? undefined,
        reference_type: entry.cite.reference_type ?? "openalex",
      };
    }

    return {
      source: entry.source ?? "",
      title: entry.title,
      year: String(entry.year ?? new Date().getFullYear()),
      authors: [
        {
          first_name: "",
          last_name: entry.source || "Web",
        },
      ],
      reference_type: "web",
    };
  };

  const toggle = (entry: LibraryEntry) => {
    const cite = toCite(entry);
    const identifier = cite.openalex_id || cite.title;
    if (isSelected(entry)) {
      removeSelectedCite(identifier);
    } else {
      addSelectedCite(cite);
    }
  };

  if (fetcher.state === "loading" && !fetcher.data) {
    return (
      <Text size="sm" c="dimmed">
        Loading library…
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">
        Sources saved on this paper’s Library screen. Select to link into the
        current statement.
      </Text>
      <TextInput
        placeholder="Filter saved sources…"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        size="sm"
      />
      {filtered.length === 0 ? (
        <Box py="md">
          <Text size="sm" c="dimmed" ta="center">
            No saved sources yet. Open Library, search, and Save to library
            first.
          </Text>
        </Box>
      ) : (
        <Stack gap="xs">
          {filtered.map((entry) => {
            const selected = isSelected(entry);
            const cite = toCite(entry);
            return (
              <Card key={entry.id} withBorder padding="sm" radius="sm">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Stack gap={4} style={{ minWidth: 0 }}>
                    <Group gap={6}>
                      <Badge
                        size="xs"
                        variant="light"
                        color={entry.kind === "academic" ? "blue" : "grape"}
                      >
                        {entry.kind === "academic" ? "Academic" : "Web"}
                      </Badge>
                      {entry.year && (
                        <Text size="xs" c="dimmed">
                          {entry.year}
                        </Text>
                      )}
                    </Group>
                    <Text size="sm" fw={600} lineClamp={2}>
                      {entry.title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {generateReference(cite)}
                    </Text>
                  </Stack>
                  <Button
                    size="compact-xs"
                    variant={selected ? "light" : "filled"}
                    color={selected ? "teal" : "blue"}
                    leftSection={
                      selected ? (
                        <Icon
                          name="check-outline"
                          style={{ width: 12, height: 12 }}
                        />
                      ) : undefined
                    }
                    onClick={() => toggle(entry)}
                  >
                    {selected ? "Selected" : "Select"}
                  </Button>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
