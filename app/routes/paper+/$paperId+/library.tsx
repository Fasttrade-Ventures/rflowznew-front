import { Icon } from "#app/components/icon";
import CDivider from "#app/components/ui/CDivider";
import {
  getLibraryEntries,
  removeLibraryEntry,
  researchSearch,
  saveLibraryEntry,
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
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";

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
    const q = formData.get("q");
    invariant(typeof q === "string" && q.trim(), "q is required");
    const res = await searchOpenAlexCitations({ request, paperId, q });

    return json({
      intent: "academic-search" as const,
      works: res.data?.works ?? [],
      failed: !(res.data?.success ?? false),
    });
  }

  if (intent === "policy-search") {
    const q = formData.get("q");
    invariant(typeof q === "string" && q.trim(), "q is required");
    const res = await researchSearch({ request, paperId, query: q });

    return json({
      intent: "policy-search" as const,
      results: res.data?.results ?? [],
      failed: !(res.data?.success ?? false),
    });
  }

  if (intent === "save") {
    const entry = JSON.parse(formData.get("entry") as string);
    await saveLibraryEntry({ request, paperId, entry });

    return json({ intent: "save" as const });
  }

  if (intent === "remove") {
    const entryId = formData.get("entryId");
    invariant(typeof entryId === "string", "entryId is required");
    await removeLibraryEntry({ request, paperId, entryId });

    return json({ intent: "remove" as const });
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
});

const webEntryPayload = (result: WebSearchResult) => ({
  kind: "web",
  title: result.title,
  source: hostOf(result.url),
  url: result.url,
  year: result.published_date
    ? Number(result.published_date.slice(0, 4)) || null
    : null,
  summary: result.summary,
});

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
        {saved ? "Saved" : "Save to library"}
      </Button>
    </fetcher.Form>
  );
}

export const LibraryPage = () => {
  const { paperId, entries } = useLoaderData<typeof loader>();
  const academicFetcher = useFetcher<typeof action>();
  const policyFetcher = useFetcher<typeof action>();
  const removeFetcher = useFetcher();

  const [academicQuery, setAcademicQuery] = useState("");
  const [policyQuery, setPolicyQuery] = useState("");

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

  return (
    <Stack>
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
                            {[entry.source, entry.year]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        </Box>
                        <Group gap="xs" wrap="nowrap">
                          {entry.url && (
                            <Anchor href={entry.url} target="_blank" size="xs">
                              Open ↗
                            </Anchor>
                          )}
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
    </Stack>
  );
};

export default LibraryPage;
