import type { LibraryEntry } from "#app/services/library.server";
import { formatApaReference } from "#app/utils/format-library-reference";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

type EditCitationModalProps = {
  mode: "create" | "edit";
  entry: LibraryEntry | null;
  opened: boolean;
  onClose: () => void;
  onSubmit: (
    patch: Record<string, unknown>,
    kind: LibraryEntry["kind"]
  ) => void;
  loading?: boolean;
  error?: string | null;
};

const EMPTY_ENTRY: LibraryEntry = {
  id: 0,
  user_id: null,
  paper_id: null,
  kind: "academic",
  title: "",
  source: null,
  url: null,
  year: null,
  openalex_id: null,
  cite: null,
  summary: null,
  is_cited: false,
  created_at: "",
  updated_at: "",
};

function optionalInt(value: string | number): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function authorsFromEntry(entry: LibraryEntry): string {
  const authors = entry.cite?.authors ?? [];
  if (authors.length === 0) return entry.source ?? "";
  return authors
    .map((author) =>
      [author.first_name, author.last_name].filter(Boolean).join(" ").trim()
    )
    .filter(Boolean)
    .join(", ");
}

function resetFormFields(
  setters: {
    setTitle: (v: string) => void;
    setAuthor: (v: string) => void;
    setSource: (v: string) => void;
    setYear: (v: string | number) => void;
    setMonth: (v: string | number) => void;
    setDay: (v: string | number) => void;
    setUrl: (v: string) => void;
    setSummary: (v: string) => void;
    setDoi: (v: string) => void;
    setVolume: (v: string) => void;
    setIssue: (v: string) => void;
    setFirstPage: (v: string) => void;
    setLastPage: (v: string) => void;
  }
) {
  setters.setTitle("");
  setters.setAuthor("");
  setters.setSource("");
  setters.setYear("");
  setters.setMonth("");
  setters.setDay("");
  setters.setUrl("");
  setters.setSummary("");
  setters.setDoi("");
  setters.setVolume("");
  setters.setIssue("");
  setters.setFirstPage("");
  setters.setLastPage("");
}

export function EditCitationModal({
  mode,
  entry,
  opened,
  onClose,
  onSubmit,
  loading,
  error,
}: EditCitationModalProps) {
  const [kind, setKind] = useState<LibraryEntry["kind"]>("academic");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [source, setSource] = useState("");
  const [year, setYear] = useState<string | number>("");
  const [month, setMonth] = useState<string | number>("");
  const [day, setDay] = useState<string | number>("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [doi, setDoi] = useState("");
  const [volume, setVolume] = useState("");
  const [issue, setIssue] = useState("");
  const [firstPage, setFirstPage] = useState("");
  const [lastPage, setLastPage] = useState("");

  const effectiveKind = mode === "edit" ? entry?.kind ?? "academic" : kind;

  useEffect(() => {
    if (!opened) return;

    if (mode === "create") {
      setKind("academic");
      resetFormFields({
        setTitle,
        setAuthor,
        setSource,
        setYear,
        setMonth,
        setDay,
        setUrl,
        setSummary,
        setDoi,
        setVolume,
        setIssue,
        setFirstPage,
        setLastPage,
      });
      return;
    }

    if (!entry) return;

    setKind(entry.kind);
    setTitle(entry.title ?? "");
    setAuthor(
      entry.kind === "web"
        ? entry.cite?.authors?.[0]?.last_name ?? entry.source ?? ""
        : authorsFromEntry(entry)
    );
    setSource(entry.source ?? "");
    setYear(entry.year ?? "");
    setMonth(entry.cite?.month ?? "");
    setDay(entry.cite?.day ?? "");
    setUrl(entry.url ?? "");
    setSummary(entry.summary ?? "");
    setDoi(entry.cite?.doi ?? "");
    setVolume(entry.cite?.volume ?? "");
    setIssue(entry.cite?.issue ?? "");
    setFirstPage(entry.cite?.first_page ?? "");
    setLastPage(entry.cite?.last_page ?? "");
    // Only re-init when opening the modal for a specific entry — not on loader revalidates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, entry?.id, opened]);

  const previewEntry = useMemo((): LibraryEntry | null => {
    if (!opened) return null;

    const parsedYear = optionalInt(year);
    const parsedMonth = optionalInt(month);
    const parsedDay = optionalInt(day);
    const base = entry ?? { ...EMPTY_ENTRY, kind: effectiveKind };

    if (effectiveKind === "web") {
      return {
        ...base,
        kind: "web",
        title: title.trim(),
        source: source.trim() || author.trim(),
        year: parsedYear,
        url: url.trim() || null,
        summary: summary.trim() || null,
        cite: {
          ...(base.cite ?? {}),
          authors: [
            {
              first_name: null,
              last_name: author.trim() || source.trim() || "Web",
            },
          ],
          year: parsedYear,
          month: parsedMonth,
          day: parsedDay,
          title: title.trim(),
          source: source.trim() || author.trim(),
          url: url.trim() || null,
          reference_type: "web",
        },
      };
    }

    return {
      ...base,
      kind: "academic",
      title: title.trim(),
      source: source.trim() || null,
      year: parsedYear,
      url: url.trim() || null,
      cite: {
        ...(base.cite ?? {
          authors: [{ first_name: null, last_name: "Unknown" }],
          title: title.trim(),
        }),
        authors: author.trim()
          ? author.split(",").map((name) => {
              const parts = name.trim().split(/\s+/);
              if (parts.length === 1) {
                return { first_name: null, last_name: parts[0] };
              }
              return {
                first_name: parts.slice(0, -1).join(" "),
                last_name: parts[parts.length - 1],
              };
            })
          : base.cite?.authors ?? [{ first_name: null, last_name: "Unknown" }],
        year: parsedYear,
        title: title.trim(),
        source: source.trim() || null,
        doi: doi.trim() || null,
        volume: volume.trim() || null,
        issue: issue.trim() || null,
        first_page: firstPage.trim() || null,
        last_page: lastPage.trim() || null,
        reference_type: base.cite?.reference_type ?? "manual",
        openalex_id: base.cite?.openalex_id ?? null,
      },
    };
  }, [
    author,
    day,
    doi,
    effectiveKind,
    entry,
    firstPage,
    issue,
    lastPage,
    month,
    opened,
    source,
    summary,
    title,
    url,
    volume,
    year,
  ]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    const patch: Record<string, unknown> = {
      title: title.trim(),
      source: source.trim() || null,
      url: url.trim() || null,
      year: optionalInt(year),
    };

    if (effectiveKind === "web") {
      patch.author = author.trim() || source.trim();
      patch.month = optionalInt(month);
      patch.day = optionalInt(day);
      patch.summary = summary.trim() || null;
    } else {
      patch.authors = author.trim();
      patch.doi = doi.trim() || null;
      patch.volume = volume.trim() || null;
      patch.issue = issue.trim() || null;
      patch.first_page = firstPage.trim() || null;
      patch.last_page = lastPage.trim() || null;
    }

    onSubmit(patch, effectiveKind);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === "create" ? "Add manual citation" : "Edit citation"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          {mode === "create" ? (
            <SegmentedControl
              value={kind}
              onChange={(value) => setKind(value as LibraryEntry["kind"])}
              data={[
                { label: "Academic", value: "academic" },
                { label: "Web / policy", value: "web" },
              ]}
            />
          ) : null}

          <TextInput
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            required
          />

          {effectiveKind === "web" ? (
            <>
              <TextInput
                label="Author / organisation"
                description="APA group author, e.g. Malay Mail"
                value={author}
                onChange={(e) => setAuthor(e.currentTarget.value)}
              />
              <TextInput
                label="Site name"
                description="Usually same as organisation for news sites"
                value={source}
                onChange={(e) => setSource(e.currentTarget.value)}
              />
              <Group grow>
                <NumberInput
                  label="Year"
                  value={year}
                  onChange={setYear}
                  min={1900}
                  max={2100}
                />
                <NumberInput
                  label="Month"
                  value={month}
                  onChange={setMonth}
                  min={1}
                  max={12}
                />
                <NumberInput
                  label="Day"
                  value={day}
                  onChange={setDay}
                  min={1}
                  max={31}
                />
              </Group>
              <TextInput
                label="URL"
                value={url}
                onChange={(e) => setUrl(e.currentTarget.value)}
              />
              <Textarea
                label="Summary (optional)"
                value={summary}
                onChange={(e) => setSummary(e.currentTarget.value)}
                minRows={2}
              />
            </>
          ) : (
            <>
              <TextInput
                label="Authors"
                description="Comma-separated: Santos Maria, Chen Wei"
                value={author}
                onChange={(e) => setAuthor(e.currentTarget.value)}
              />
              <Group grow>
                <NumberInput
                  label="Year"
                  value={year}
                  onChange={setYear}
                  min={1900}
                  max={2100}
                />
                <TextInput
                  label="Journal / source"
                  value={source}
                  onChange={(e) => setSource(e.currentTarget.value)}
                />
              </Group>
              <Group grow>
                <TextInput
                  label="Volume"
                  value={volume}
                  onChange={(e) => setVolume(e.currentTarget.value)}
                />
                <TextInput
                  label="Issue"
                  value={issue}
                  onChange={(e) => setIssue(e.currentTarget.value)}
                />
              </Group>
              <Group grow>
                <TextInput
                  label="First page"
                  value={firstPage}
                  onChange={(e) => setFirstPage(e.currentTarget.value)}
                />
                <TextInput
                  label="Last page"
                  value={lastPage}
                  onChange={(e) => setLastPage(e.currentTarget.value)}
                />
              </Group>
              <TextInput
                label="DOI or URL"
                value={doi || url}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  if (value.includes("doi.org")) {
                    setDoi(value.replace(/^https?:\/\/doi\.org\//, ""));
                    setUrl(value);
                  } else {
                    setDoi(value);
                    setUrl(value);
                  }
                }}
              />
            </>
          )}

          {previewEntry ? (
            <Stack gap={4}>
              <Text size="xs" fw={600}>
                APA 7 preview
              </Text>
              <Text size="xs" style={{ lineHeight: 1.5 }}>
                {formatApaReference(previewEntry)}
              </Text>
            </Stack>
          ) : null}

          {error ? (
            <Text size="xs" c="red">
              {error}
            </Text>
          ) : null}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!title.trim()}>
              {mode === "create" ? "Add to library" : "Save citation"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
