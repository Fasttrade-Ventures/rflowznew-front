import { Icon } from "#app/components/icon";
import { EditCitationModal } from "#app/components/paper-v2/EditCitationModal";
import { LibraryV2Screen } from "#app/components/paper-v2/LibraryV2Screen";
import libraryClasses from "#app/components/paper-v2/library-v2.module.css";
import { loader as paperLayoutLoader } from "#app/routes/paper+/$paperId+/_layout";
import CDivider from "#app/components/ui/CDivider";
import { usePaperV2Flow } from "#app/utils/use-paper-v2-flow";
import { formatApaReference } from "#app/utils/format-library-reference";
import {
  attachLibraryEntry,
  getLibraryEntries,
  removeLibraryEntry,
  researchSearch,
  saveLibraryEntry,
  toggleLibraryEntryCite,
  updateLibraryEntry,
  type LibraryEntry,
  type WebSearchResult,
} from "#app/services/library.server";
import {
  searchOpenAlexCitations,
  type OpenAlexWork,
} from "#app/services/openalex.server";
import { invariant } from "@epic-web/invariant";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Modal,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useRevalidator,
  useRouteLoaderData,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

const ATTACH_SECTIONS = [
  { value: "background_study", label: "Background study" },
  { value: "motivational_problem", label: "Motivational problem" },
  { value: "research_problem", label: "Research problem" },
  { value: "literature_review", label: "Literature review" },
  { value: "methodology", label: "Methodology" },
] as const;

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { paperId } = params;
  invariant(paperId, "paperId is required");

  const res = await getLibraryEntries({ request, paperId });

  return json({
    paperId,
    entries: res.data?.entries ?? [],
  });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { paperId } = params;
  invariant(paperId, "paperId is required");

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "academic-search") {
    const q = (formData.get("academic_q") ?? formData.get("q")) as string | null;
    invariant(typeof q === "string" && q.trim(), "q is required");
    const res = await searchOpenAlexCitations({ request, paperId, q });

    return json({
      intent: "academic-search" as const,
      works: res.data?.works ?? [],
      failed: !(res.data?.success ?? false),
    });
  }

  if (intent === "policy-search") {
    const q = (formData.get("policy_q") ?? formData.get("q")) as string | null;
    invariant(typeof q === "string" && q.trim(), "q is required");
    const res = await researchSearch({ request, paperId, query: q });

    return json({
      intent: "policy-search" as const,
      results: res.data?.results ?? [],
      failed: !(res.data?.success ?? false),
    });
  }

  if (intent === "save") {
    try {
      const entry = JSON.parse(formData.get("entry") as string);
      const res = await saveLibraryEntry({ request, paperId, entry });

      return json({
        intent: "save" as const,
        success: res.data?.success ?? false,
        entry: res.data?.entry,
        failed: !(res.data?.success ?? false),
        message: res.data?.message,
      });
    } catch (error) {
      return json({
        intent: "save" as const,
        success: false,
        failed: true,
        message:
          error instanceof Error ? error.message : "Could not add citation.",
      });
    }
  }

  if (intent === "save-and-cite") {
    try {
      const entry = {
        ...JSON.parse(formData.get("entry") as string),
        is_cited: true,
      };
      const saveRes = await saveLibraryEntry({ request, paperId, entry });

      return json({
        intent: "save-and-cite" as const,
        success: saveRes.data?.success ?? false,
        entry: saveRes.data?.entry,
        failed: !(saveRes.data?.success ?? false),
      });
    } catch (error) {
      return json({
        intent: "save-and-cite" as const,
        success: false,
        failed: true,
        message:
          error instanceof Error ? error.message : "Could not save citation.",
      });
    }
  }

  if (intent === "toggle-cite") {
    try {
      const entryId = formData.get("entryId");
      const isCited = formData.get("is_cited") === "true";
      invariant(typeof entryId === "string", "entryId is required");

      const res = await toggleLibraryEntryCite({
        request,
        paperId,
        entryId,
        isCited,
      });

      return json({
        intent: "toggle-cite" as const,
        success: res.data?.success ?? false,
        entry: res.data?.entry,
        failed: !(res.data?.success ?? false),
        message: res.data?.message,
      });
    } catch (error) {
      return json({
        intent: "toggle-cite" as const,
        success: false,
        failed: true,
        message:
          error instanceof Error ? error.message : "Could not update citation.",
      });
    }
  }

  if (intent === "remove") {
    const entryId = formData.get("entryId");
    invariant(typeof entryId === "string", "entryId is required");
    await removeLibraryEntry({ request, paperId, entryId });

    return json({ intent: "remove" as const });
  }

  if (intent === "update") {
    const entryId = formData.get("entryId");
    const patch = JSON.parse(formData.get("patch") as string);
    invariant(typeof entryId === "string", "entryId is required");

    try {
      const res = await updateLibraryEntry({
        request,
        paperId,
        entryId,
        patch,
      });

      return json({
        intent: "update" as const,
        success: res.data?.success ?? false,
        entry: res.data?.entry,
        formatted_reference: res.data?.formatted_reference,
        failed: !(res.data?.success ?? false),
        message: res.data?.message,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not update citation. Restart the API server if you just pulled new code.";

      return json({
        intent: "update" as const,
        success: false,
        failed: true,
        message,
      });
    }
  }

  if (intent === "attach") {
    const entryId = formData.get("entryId");
    const section = formData.get("section");
    invariant(typeof entryId === "string", "entryId is required");
    invariant(
      typeof section === "string" && section.trim(),
      "section is required"
    );

    const res = await attachLibraryEntry({
      request,
      paperId,
      entryId,
      section,
    });

    return json({
      intent: "attach" as const,
      success: res.data?.success ?? false,
      alreadyAttached: res.data?.already_attached ?? false,
      message: res.data?.message,
      failed: !(res.data?.success ?? false),
    });
  }

  return json({ intent: "unknown" as const });
};

const hostOf = (url: string | null): string => {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const academicEntryPayload = (work: OpenAlexWork) => ({
  kind: "academic",
  title: work.title,
  source: work.venue,
  url: work.doi ? `https://doi.org/${work.doi.replace(/^https?:\/\/doi\.org\//, "")}` : null,
  year: work.year,
  openalex_id: work.openalex_id,
  cite: work.cite,
  summary: work.abstract || null,
});

const webEntryPayload = (result: WebSearchResult) => ({
  kind: "web",
  title: result.title,
  url: result.url,
  published_date: result.published_date,
  author: result.author,
  summary: result.summary,
});

const parseAuthors = (authors: string) =>
  authors
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const parts = name.split(/\s+/);
      if (parts.length === 1) {
        return { first_name: null, last_name: parts[0] };
      }
      return {
        first_name: parts.slice(0, -1).join(" "),
        last_name: parts[parts.length - 1],
      };
    });

const buildSavePayload = (
  kind: LibraryEntry["kind"],
  patch: Record<string, unknown>
) => {
  if (kind === "web") {
    return {
      kind: "web",
      title: patch.title,
      url: patch.url,
      author: patch.author,
      year: patch.year,
      month: patch.month,
      day: patch.day,
      summary: patch.summary,
    };
  }

  const authorList = parseAuthors(String(patch.authors ?? ""));
  const doiValue = patch.doi ? String(patch.doi) : null;

  return {
    kind: "academic",
    title: patch.title,
    source: patch.source,
    url: patch.url,
    year: patch.year,
    openalex_id: null,
    cite: {
      authors: authorList.length
        ? authorList
        : [{ first_name: null, last_name: "Unknown" }],
      year: patch.year,
      title: patch.title,
      source: patch.source,
      doi: doiValue,
      volume: patch.volume ?? null,
      issue: patch.issue ?? null,
      first_page: patch.first_page ?? null,
      last_page: patch.last_page ?? null,
      reference_type: "manual",
      openalex_id: null,
    },
  };
};

function CiteCheckbox({
  active,
  disabled,
  pending,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  pending?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`${libraryClasses.citeCheck} ${active ? libraryClasses.citeCheckActive : ""} ${pending ? libraryClasses.citeCheckPending : ""}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={active ? "Remove from cited sources" : "Use as citation"}
      aria-pressed={active}
    >
      {active ? "✓" : null}
    </button>
  );
}

function SaveButton({
  paperId,
  payload,
  saved,
}: {
  paperId: string;
  payload: Record<string, unknown>;
  saved: boolean;
}) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action={`/paper/${paperId}/library`}>
      <input type="hidden" name="intent" value="save" />
      <input type="hidden" name="entry" value={JSON.stringify(payload)} />
      <Button
        type="submit"
        size="compact-xs"
        variant={saved ? "light" : "filled"}
        disabled={saved}
        loading={fetcher.state !== "idle"}
      >
        {saved ? "Saved" : "Save"}
      </Button>
    </fetcher.Form>
  );
}

function CiteToggleControl({
  paperId,
  entry,
  isCited,
}: {
  paperId: string;
  entry: LibraryEntry;
  isCited: boolean;
}) {
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const handledRef = useRef(false);
  const [optimisticCited, setOptimisticCited] = useState<boolean | null>(null);
  const canCite =
    entry.kind === "web" || (entry.kind === "academic" && !!entry.cite);
  const pending = fetcher.state !== "idle";
  const displayedCited = optimisticCited ?? isCited;

  useEffect(() => {
    if (fetcher.state === "submitting") {
      handledRef.current = false;
      return;
    }

    if (fetcher.state !== "idle" || fetcher.data?.intent !== "toggle-cite") {
      return;
    }

    if (handledRef.current) {
      return;
    }

    handledRef.current = true;

    if (fetcher.data.success) {
      setOptimisticCited(null);
      revalidator.revalidate();
      return;
    }

    setOptimisticCited(null);
  }, [fetcher.state, fetcher.data, revalidator]);

  const handleClick = () => {
    if (!canCite || pending) return;
    const next = !displayedCited;
    setOptimisticCited(next);
    const formData = new FormData();
    formData.set("intent", "toggle-cite");
    formData.set("entryId", String(entry.id));
    formData.set("is_cited", next ? "true" : "false");
    fetcher.submit(formData, {
      method: "post",
      action: `/paper/${paperId}/library`,
    });
  };

  return (
    <CiteCheckbox
      active={displayedCited}
      disabled={!canCite}
      pending={pending}
      onClick={handleClick}
    />
  );
}

function SaveAndCiteControl({
  paperId,
  entryPayload,
  isCited,
}: {
  paperId: string;
  entryPayload: Record<string, unknown>;
  isCited: boolean;
}) {
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const handledRef = useRef(false);
  const [optimisticCited, setOptimisticCited] = useState(false);
  const pending = fetcher.state !== "idle";
  const displayedCited = isCited || optimisticCited;

  useEffect(() => {
    if (fetcher.state === "submitting") {
      handledRef.current = false;
      return;
    }

    if (fetcher.state !== "idle" || fetcher.data?.intent !== "save-and-cite") {
      return;
    }

    if (handledRef.current) {
      return;
    }

    handledRef.current = true;

    if (fetcher.data.success) {
      setOptimisticCited(false);
      revalidator.revalidate();
      return;
    }

    setOptimisticCited(false);
  }, [fetcher.state, fetcher.data, revalidator]);

  const handleClick = () => {
    if (displayedCited || pending) return;
    setOptimisticCited(true);
    const formData = new FormData();
    formData.set("intent", "save-and-cite");
    formData.set("entry", JSON.stringify(entryPayload));
    fetcher.submit(formData, {
      method: "post",
      action: `/paper/${paperId}/library`,
    });
  };

  return (
    <CiteCheckbox
      active={displayedCited}
      pending={pending}
      onClick={handleClick}
    />
  );
}

function WorkCiteControl({
  paperId,
  work,
  savedEntry,
}: {
  paperId: string;
  work: OpenAlexWork;
  savedEntry?: LibraryEntry;
}) {
  if (savedEntry) {
    return (
      <CiteToggleControl
        paperId={paperId}
        entry={savedEntry}
        isCited={savedEntry.is_cited ?? false}
      />
    );
  }

  return (
    <SaveAndCiteControl
      paperId={paperId}
      entryPayload={academicEntryPayload(work)}
      isCited={false}
    />
  );
}

function WebResultCiteControl({
  paperId,
  result,
  savedEntry,
}: {
  paperId: string;
  result: WebSearchResult;
  savedEntry?: LibraryEntry;
}) {
  if (savedEntry) {
    return (
      <CiteToggleControl
        paperId={paperId}
        entry={savedEntry}
        isCited={savedEntry.is_cited ?? false}
      />
    );
  }

  return (
    <SaveAndCiteControl
      paperId={paperId}
      entryPayload={webEntryPayload(result)}
      isCited={false}
    />
  );
}

function EditCitationButton({
  entry,
  onEdit,
}: {
  entry: LibraryEntry;
  onEdit: (entry: LibraryEntry) => void;
}) {
  return (
    <Button size="compact-xs" variant="light" onClick={() => onEdit(entry)}>
      Edit
    </Button>
  );
}

function InsertCitationButton({
  paperId,
  entry,
}: {
  paperId: string;
  entry: LibraryEntry;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const [section, setSection] = useState<string | null>("motivational_problem");
  const fetcher = useFetcher<typeof action>();
  const canAttach =
    entry.kind === "web" || (entry.kind === "academic" && !!entry.cite);

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data?.intent === "attach" &&
      fetcher.data.success
    ) {
      close();
    }
  }, [fetcher.state, fetcher.data, close]);

  return (
    <>
      <Tooltip
        label={
          canAttach
            ? "Attach as citation to a section"
            : "Academic entry needs a full cite object"
        }
      >
        <Button
          size="compact-xs"
          variant="light"
          disabled={!canAttach}
          onClick={open}
        >
          Insert citation
        </Button>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={close}
        title="Insert citation into section"
        size="sm"
      >
        <fetcher.Form method="post" action={`/paper/${paperId}/library`}>
          <input type="hidden" name="intent" value="attach" />
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="section" value={section ?? ""} />
          <Stack gap="sm">
            <Text size="sm" fw={600} lineClamp={2}>
              {entry.title}
            </Text>
            <Select
              label="Section"
              data={[...ATTACH_SECTIONS]}
              value={section}
              onChange={setSection}
              required
            />
            {fetcher.data?.intent === "attach" && fetcher.data.failed && (
              <Text size="sm" c="red">
                {fetcher.data.message || "Could not attach citation."}
              </Text>
            )}
            <Group justify="flex-end">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!section}
                loading={fetcher.state !== "idle"}
              >
                Attach
              </Button>
            </Group>
          </Stack>
        </fetcher.Form>
      </Modal>
    </>
  );
}

export const LibraryPage = () => {
  const { paperId, entries } = useLoaderData<typeof loader>();
  const layoutData =
    useRouteLoaderData<typeof paperLayoutLoader>(
      "routes/paper+/$paperId+/_layout"
    );
  const isV2 = usePaperV2Flow();
  const academicFetcher = useFetcher<typeof action>();
  const policyFetcher = useFetcher<typeof action>();
  const removeFetcher = useFetcher();
  const saveFetcher = useFetcher<typeof action>();
  const updateFetcher = useFetcher<typeof action>();
  const [citationModalMode, setCitationModalMode] = useState<
    "create" | "edit" | null
  >(null);
  const [editingEntry, setEditingEntry] = useState<LibraryEntry | null>(null);

  const [academicQuery, setAcademicQuery] = useState("");
  const [policyQuery, setPolicyQuery] = useState("");

  const citedEntryCount = entries.filter((entry) => Boolean(entry.is_cited)).length;

  useEffect(() => {
    const paper = layoutData?.paper;
    if (!isV2 || !paper) return;
    setAcademicQuery((current) => {
      if (current) return current;
      const keywords = paper.keywords?.filter(Boolean) ?? [];
      if (keywords.length > 0) return keywords.slice(0, 4).join(" ");
      return paper.title ?? "";
    });
    setPolicyQuery((current) => {
      if (current || !paper.title) return current;
      return `${paper.title} policy media`.slice(0, 200);
    });
  }, [isV2, layoutData?.paper?.id, layoutData?.paper]);

  const academicWorks =
    academicFetcher.data?.intent === "academic-search"
      ? academicFetcher.data.works
      : [];
  const policyResults =
    policyFetcher.data?.intent === "policy-search"
      ? policyFetcher.data.results
      : [];

  const savedAcademicIds = new Set(
    entries.filter((e) => e.kind === "academic").map((e) => e.openalex_id)
  );
  const savedUrls = new Set(entries.map((e) => e.url).filter(Boolean));

  const academicEntries = entries.filter((e) => e.kind === "academic");
  const webEntries = entries.filter((e) => e.kind === "web");

  const revalidator = useRevalidator();
  const updateHandledRef = useRef(false);
  const saveHandledRef = useRef(false);

  const closeCitationModal = () => {
    setCitationModalMode(null);
    setEditingEntry(null);
  };

  const openCreateCitation = () => {
    setEditingEntry(null);
    setCitationModalMode("create");
  };

  const openEditCitation = (entry: LibraryEntry) => {
    setEditingEntry(entry);
    setCitationModalMode("edit");
  };

  useEffect(() => {
    if (updateFetcher.state === "submitting") {
      updateHandledRef.current = false;
      return;
    }

    if (
      updateFetcher.state !== "idle" ||
      updateFetcher.data?.intent !== "update" ||
      !updateFetcher.data.success ||
      updateHandledRef.current
    ) {
      return;
    }

    updateHandledRef.current = true;
    closeCitationModal();
    revalidator.revalidate();
  }, [updateFetcher.state, updateFetcher.data, revalidator]);

  useEffect(() => {
    if (saveFetcher.state === "submitting") {
      saveHandledRef.current = false;
      return;
    }

    if (
      saveFetcher.state !== "idle" ||
      saveFetcher.data?.intent !== "save" ||
      saveHandledRef.current
    ) {
      return;
    }

    saveHandledRef.current = true;
    closeCitationModal();
    revalidator.revalidate();
  }, [saveFetcher.state, saveFetcher.data, revalidator]);

  const handleCitationSubmit = (
    patch: Record<string, unknown>,
    kind: LibraryEntry["kind"]
  ) => {
    if (citationModalMode === "create") {
      const formData = new FormData();
      formData.set("intent", "save");
      formData.set("entry", JSON.stringify(buildSavePayload(kind, patch)));
      saveFetcher.submit(formData, {
        method: "post",
        action: `/paper/${paperId}/library`,
      });
      return;
    }

    if (!editingEntry) return;

    const formData = new FormData();
    formData.set("intent", "update");
    formData.set("entryId", String(editingEntry.id));
    formData.set("patch", JSON.stringify(patch));
    updateFetcher.submit(formData, {
      method: "post",
      action: `/paper/${paperId}/library`,
    });
  };

  const citationModalError =
    citationModalMode === "create" &&
    saveFetcher.data?.intent === "save" &&
    saveFetcher.data.failed
      ? "Could not add citation."
      : citationModalMode === "edit" &&
          updateFetcher.data?.intent === "update" &&
          updateFetcher.data.failed
        ? updateFetcher.data.message ?? "Could not save citation."
        : null;

  const citationModalLoading =
    citationModalMode === "create"
      ? saveFetcher.state !== "idle"
      : updateFetcher.state !== "idle";

  const citationModal = (
    <EditCitationModal
      mode={citationModalMode === "create" ? "create" : "edit"}
      entry={editingEntry}
      opened={citationModalMode !== null}
      onClose={closeCitationModal}
      onSubmit={handleCitationSubmit}
      loading={citationModalLoading}
      error={citationModalError}
    />
  );

  const page = (
    <Stack>
      {!isV2 && (
        <>
          <Stack pr="md" pl="md">
            <Group justify="space-between">
              <Stack gap={2}>
                <Title order={4}>Source Library</Title>
                <Text size="xs" c="dimmed">
                  Search literature and policy/media, save sources to this paper,
                  then attach them to sections as citations.
                </Text>
              </Stack>
              <Group gap="xs">
                {(["bibtex", "ris", "xml"] as const).map((format) => (
                  <Button
                    key={format}
                    component="a"
                    href={`/resources/library-export?paperId=${paperId}&format=${format}`}
                    variant="light"
                    size="compact-sm"
                    disabled={academicEntries.length === 0}
                  >
                    {format === "bibtex" ? "BibTeX" : format.toUpperCase()}
                  </Button>
                ))}
              </Group>
            </Group>
          </Stack>
          <CDivider />
        </>
      )}

      <Grid pr="md" pl="md" gutter="md">
        {/* Literature RAG panel */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card withBorder padding="md" radius="md">
            <Stack gap="sm">
              <Group gap="xs">
                <Title order={6}>Literature search</Title>
                <Badge size="xs" variant="light">
                  Academic RAG
                </Badge>
              </Group>
              <academicFetcher.Form
                method="post"
                action={`/paper/${paperId}/library`}
              >
                <input type="hidden" name="intent" value="academic-search" />
                <Group gap="xs" wrap="nowrap">
                  <TextInput
                    name="q"
                    value={academicQuery}
                    onChange={(e) => setAcademicQuery(e.currentTarget.value)}
                    placeholder='Boolean supported: "crop yield" AND (ml OR ai) NOT survey'
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="submit"
                    loading={academicFetcher.state !== "idle"}
                    disabled={!academicQuery.trim()}
                  >
                    Search
                  </Button>
                </Group>
              </academicFetcher.Form>

              {academicFetcher.data?.intent === "academic-search" &&
                academicFetcher.data.failed && (
                  <Text size="sm" c="red">
                    Academic search is temporarily unavailable.
                  </Text>
                )}

              <Stack gap="xs">
                {academicWorks.map((work) => (
                  <Card key={work.openalex_id} withBorder padding="sm" radius="sm">
                    <Stack gap={4}>
                      <Group gap="xs">
                        <Badge size="xs" variant="outline">
                          {work.year ?? "n.d."}
                        </Badge>
                        {work.is_open_access && (
                          <Badge size="xs" color="green" variant="light">
                            Open access
                          </Badge>
                        )}
                        <Text size="xs" c="dimmed">
                          Cited by {work.cited_by_count}
                        </Text>
                      </Group>
                      <Text size="sm" fw={600}>
                        {work.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {work.venue ?? "Unknown venue"}
                      </Text>
                      <Group justify="space-between" mt={4}>
                        {work.doi ? (
                          <Anchor
                            href={`https://doi.org/${work.doi.replace(/^https?:\/\/doi\.org\//, "")}`}
                            target="_blank"
                            size="xs"
                          >
                            Confirm link ↗
                          </Anchor>
                        ) : (
                          <span />
                        )}
                        <SaveButton
                          paperId={paperId}
                          payload={academicEntryPayload(work)}
                          saved={savedAcademicIds.has(work.openalex_id)}
                        />
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Policy / media panel */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card withBorder padding="md" radius="md">
            <Stack gap="sm">
              <Group gap="xs">
                <Title order={6}>Policy & media search</Title>
                <Badge size="xs" variant="light" color="grape">
                  Web evidence
                </Badge>
              </Group>
              <policyFetcher.Form
                method="post"
                action={`/paper/${paperId}/library`}
              >
                <input type="hidden" name="intent" value="policy-search" />
                <Group gap="xs" wrap="nowrap">
                  <TextInput
                    name="q"
                    value={policyQuery}
                    onChange={(e) => setPolicyQuery(e.currentTarget.value)}
                    placeholder="e.g. national precision agriculture policy"
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="submit"
                    color="grape"
                    loading={policyFetcher.state !== "idle"}
                    disabled={!policyQuery.trim()}
                  >
                    Search
                  </Button>
                </Group>
              </policyFetcher.Form>

              {policyFetcher.data?.intent === "policy-search" &&
                policyFetcher.data.failed && (
                  <Text size="sm" c="red">
                    Web search is temporarily unavailable.
                  </Text>
                )}

              <Stack gap="xs">
                {policyResults.map((result) => (
                  <Card key={result.url} withBorder padding="sm" radius="sm">
                    <Stack gap={4}>
                      <Group gap="xs">
                        <Badge size="xs" variant="outline" color="grape">
                          {hostOf(result.url)}
                        </Badge>
                        {result.published_date && (
                          <Text size="xs" c="dimmed">
                            {result.published_date.slice(0, 10)}
                          </Text>
                        )}
                      </Group>
                      <Text size="sm" fw={600}>
                        {result.title}
                      </Text>
                      {result.summary && (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {result.summary}
                        </Text>
                      )}
                      <Group justify="space-between" mt={4}>
                        <Anchor href={result.url} target="_blank" size="xs">
                          Confirm link ↗
                        </Anchor>
                        <SaveButton
                          paperId={paperId}
                          payload={webEntryPayload(result)}
                          saved={savedUrls.has(result.url)}
                        />
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <CDivider />

      {/* Saved library */}
      <Stack pr="md" pl="md" pb="md">
        <Title order={5}>Saved sources ({entries.length})</Title>
        <Tabs defaultValue="academic">
          <Tabs.List>
            <Tabs.Tab value="academic">
              Academic ({academicEntries.length})
            </Tabs.Tab>
            <Tabs.Tab value="web">Policy / media ({webEntries.length})</Tabs.Tab>
          </Tabs.List>

          {(["academic", "web"] as const).map((kind) => (
            <Tabs.Panel key={kind} value={kind} pt="sm">
              <Stack gap="xs">
                {(kind === "academic" ? academicEntries : webEntries).length ===
                  0 && (
                  <Text size="sm" c="dimmed">
                    Nothing saved yet — use the search panels above.
                  </Text>
                )}
                {(kind === "academic" ? academicEntries : webEntries).map(
                  (entry: LibraryEntry) => (
                    <Card key={entry.id} withBorder padding="sm" radius="sm">
                      <Group justify="space-between" wrap="nowrap">
                        <Box>
                          <Text size="sm" fw={600}>
                            {entry.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {formatApaReference(entry)}
                          </Text>
                        </Box>
                        <Group gap="xs" wrap="nowrap">
                          {entry.url && (
                            <Anchor href={entry.url} target="_blank" size="xs">
                              Open ↗
                            </Anchor>
                          )}
                          <EditCitationButton
                            entry={entry}
                            onEdit={openEditCitation}
                          />
                          <InsertCitationButton
                            paperId={paperId}
                            entry={entry}
                          />
                          <removeFetcher.Form
                            method="post"
                            action={`/paper/${paperId}/library`}
                          >
                            <input type="hidden" name="intent" value="remove" />
                            <input
                              type="hidden"
                              name="entryId"
                              value={entry.id}
                            />
                            <Tooltip label="Remove from library">
                              <ActionIcon
                                type="submit"
                                variant="subtle"
                                color="red"
                                size="sm"
                              >
                                <Icon
                                  name="pika-delete"
                                  style={{ width: 14, height: 14 }}
                                />
                              </ActionIcon>
                            </Tooltip>
                          </removeFetcher.Form>
                        </Group>
                      </Group>
                    </Card>
                  )
                )}
              </Stack>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Stack>
      {citationModal}
    </Stack>
  );

  if (isV2) {
    return (
      <>
        <LibraryV2Screen
          paperId={paperId}
          paperTitle={layoutData?.paper?.title}
          entries={entries}
          academicQuery={academicQuery}
          policyQuery={policyQuery}
          onAcademicQueryChange={setAcademicQuery}
          onPolicyQueryChange={setPolicyQuery}
          academicWorks={academicWorks}
          policyResults={policyResults}
          attachedCount={citedEntryCount}
          academicFailed={
            academicFetcher.data?.intent === "academic-search" &&
            academicFetcher.data.failed
          }
          policyFailed={
            policyFetcher.data?.intent === "policy-search" &&
            policyFetcher.data.failed
          }
          academicForm={
            <academicFetcher.Form
              id="library-academic-search"
              method="post"
              action={`/paper/${paperId}/library`}
            >
              <input type="hidden" name="intent" value="academic-search" />
              <Button
                type="submit"
                size="xs"
                loading={academicFetcher.state !== "idle"}
                disabled={!academicQuery.trim()}
              >
                Search
              </Button>
            </academicFetcher.Form>
          }
          policyForm={
            <policyFetcher.Form
              id="library-policy-search"
              method="post"
              action={`/paper/${paperId}/library`}
            >
              <input type="hidden" name="intent" value="policy-search" />
              <Button
                type="submit"
                size="xs"
                loading={policyFetcher.state !== "idle"}
                disabled={!policyQuery.trim()}
              >
                Search
              </Button>
            </policyFetcher.Form>
          }
          manualCitationButton={
            <Button
              size="compact-xs"
              variant="outline"
              onClick={openCreateCitation}
            >
              + Add manual citation
            </Button>
          }
          renderAcademicSave={(work, saved) => (
            <SaveButton
              paperId={paperId}
              payload={academicEntryPayload(work)}
              saved={saved}
            />
          )}
          renderWebSave={(result, saved) => (
            <SaveButton
              paperId={paperId}
              payload={webEntryPayload(result)}
              saved={saved}
            />
          )}
          renderAcademicCite={(work, savedEntry) => (
            <WorkCiteControl
              paperId={paperId}
              work={work}
              savedEntry={savedEntry}
            />
          )}
          renderWebCite={(result, savedEntry) => (
            <WebResultCiteControl
              paperId={paperId}
              result={result}
              savedEntry={savedEntry}
            />
          )}
          renderCiteControl={(entry) => (
            <CiteToggleControl
              paperId={paperId}
              entry={entry}
              isCited={entry.is_cited ?? false}
            />
          )}
          renderRemove={(entry) => (
            <removeFetcher.Form
              method="post"
              action={`/paper/${paperId}/library`}
            >
              <input type="hidden" name="intent" value="remove" />
              <input type="hidden" name="entryId" value={entry.id} />
              <Tooltip label="Remove from library">
                <ActionIcon type="submit" variant="subtle" color="red" size="sm">
                  <Icon name="pika-delete" style={{ width: 14, height: 14 }} />
                </ActionIcon>
              </Tooltip>
            </removeFetcher.Form>
          )}
          renderEdit={(entry) => (
            <EditCitationButton entry={entry} onEdit={openEditCitation} />
          )}
        />
        {citationModal}
      </>
    );
  }

  return page;
};

export default LibraryPage;
