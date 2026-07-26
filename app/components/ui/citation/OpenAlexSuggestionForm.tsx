import { Badge, Box, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useFetcher } from "@remix-run/react";
import React from "react";
import classes from "./MendeleyCiteForm.module.css";
import { OpenAlexCitationEmptyState } from "./OpenAlexCitationEmptyState";
import { useCitationStore } from "#app/stores/citationStore";
import type { OpenAlexWork } from "#app/services/openalex.server";
import type { SuggestOpenAlexCitationsActionData } from "#app/routes/resources+/openalex+/_index";

const WorkCard = ({
  work,
  reason,
  isSelected,
  onToggle,
}: {
  work: OpenAlexWork;
  reason?: string;
  isSelected: boolean;
  onToggle: (work: OpenAlexWork) => void;
}) => (
  <Box className={classes.citationCard} mod={isSelected ? { selected: true } : {}}>
    <Stack gap={5}>
      <Group justify="space-between">
        <Group gap={5}>
          <Text size="xs" fw={500} c="var(--mantine-primary-color-4)">
            {work.year ?? "n.d."}
          </Text>
          {work.is_open_access && (
            <Badge size="xs" color="teal" variant="light">
              Open access
            </Badge>
          )}
        </Group>
        {isSelected ? (
          <Badge size="xs" color="green.8">
            Selected
          </Badge>
        ) : null}
      </Group>
      <Text size="xs" fw={500} component="span">
        {work.title}
      </Text>
      {work.venue && (
        <Text size="xs" c="dark.3" fw={400} fs="italic" component="span">
          {work.venue} &middot; Cited by {work.cited_by_count}
        </Text>
      )}
      {reason && (
        <Text size="xs" c="dimmed" component="span">
          {reason}
        </Text>
      )}
    </Stack>
    <div className={classes.overlay}>
      <Button
        onClick={() => onToggle(work)}
        className={classes.addButton}
        size="xs"
        type="button"
      >
        {isSelected ? "Unselect" : "Select"}
      </Button>
    </div>
  </Box>
);

export const OpenAlexSuggestionForm = ({
  paperId,
  section,
}: {
  paperId: string;
  section?: string;
}) => {
  const {
    openAlexSuggestionState,
    setOpenAlexSuggestions,
    setOpenAlexSuggestionsLoading,
    openAlexSearchState,
    setOpenAlexSearchQuery,
    setOpenAlexSearchResults,
    setOpenAlexSearchLoading,
    citeFormState,
    addSelectedCite,
    removeSelectedCite,
  } = useCitationStore();

  const suggestFetcher = useFetcher<SuggestOpenAlexCitationsActionData>();
  const searchFetcher = useFetcher<SuggestOpenAlexCitationsActionData>();

  React.useEffect(() => {
    if (suggestFetcher.data && suggestFetcher.data.mode === "suggest") {
      setOpenAlexSuggestions(suggestFetcher.data.suggestions);
      setOpenAlexSuggestionsLoading(false);
    }
  }, [suggestFetcher.data, setOpenAlexSuggestions, setOpenAlexSuggestionsLoading]);

  React.useEffect(() => {
    if (searchFetcher.data && searchFetcher.data.mode === "search") {
      setOpenAlexSearchResults(searchFetcher.data.works);
      setOpenAlexSearchLoading(false);
    }
  }, [searchFetcher.data, setOpenAlexSearchResults, setOpenAlexSearchLoading]);

  // Auto-fetch ranked suggestions once, on first open of the tab.
  const hasFetchedSuggestions = React.useRef(false);
  React.useEffect(() => {
    if (hasFetchedSuggestions.current) return;
    hasFetchedSuggestions.current = true;
    setOpenAlexSuggestionsLoading(true);
    suggestFetcher.submit(
      { paperId, section: section ?? "" },
      { method: "post", action: "/resources/openalex" }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!openAlexSearchState.query.trim()) return;
    setOpenAlexSearchLoading(true);
    searchFetcher.submit(
      { paperId, intent: "search", q: openAlexSearchState.query },
      { method: "post", action: "/resources/openalex" }
    );
  };

  const handleCiteSelection = (work: OpenAlexWork) => {
    const isSelected = citeFormState.selectedCites.some(
      (selectedCite) => selectedCite.openalex_id === work.openalex_id
    );
    if (isSelected) {
      removeSelectedCite(work.openalex_id);
    } else {
      addSelectedCite({
        source: work.cite.source ?? work.venue ?? "",
        title: work.title,
        year: String(work.cite.year ?? work.year ?? ""),
        doi: work.cite.doi ?? undefined,
        authors: work.authors,
        openalex_id: work.openalex_id,
        reference_type: "openalex",
      });
    }
  };

  const suggestions = openAlexSuggestionState.suggestions;
  const suggestionsLoading =
    openAlexSuggestionState.loading || suggestFetcher.state !== "idle";
  const searchResults = openAlexSearchState.results;
  const searchLoading = openAlexSearchState.loading || searchFetcher.state !== "idle";

  const isSelected = (work: OpenAlexWork) =>
    citeFormState.selectedCites.some(
      (selectedCite) => selectedCite.openalex_id === work.openalex_id
    );

  return (
    <Stack>
      <form onSubmit={handleSearch}>
        <TextInput
          placeholder="Search academic sources (e.g. a topic, author, or keyword)"
          value={openAlexSearchState.query}
          onChange={(event) => setOpenAlexSearchQuery(event.target.value)}
          rightSectionProps={{ style: { paddingRight: "0.3rem" } }}
          rightSection={
            <Button size="compact-sm" type="submit" loading={searchLoading}>
              <Text size="sm" fw={500}>
                Search
              </Text>
            </Button>
          }
          rightSectionWidth="auto"
        />
      </form>

      {searchResults !== null && (
        <Stack gap={5}>
          <Text size="xs" c="dimmed">
            Search results
          </Text>
          {searchResults.length > 0 ? (
            searchResults.map((work) => (
              <WorkCard
                key={work.openalex_id}
                work={work}
                isSelected={isSelected(work)}
                onToggle={handleCiteSelection}
              />
            ))
          ) : !searchLoading ? (
            <Text size="xs" c="dimmed">
              No results found for that search.
            </Text>
          ) : null}
        </Stack>
      )}

      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Ranked academic sources for this paper&apos;s topic
        </Text>
      </Group>
      <Stack gap={5}>
        {suggestions && suggestions.length > 0 ? (
          suggestions.map(({ work, reason }) => (
            <WorkCard
              key={work.openalex_id}
              work={work}
              reason={reason}
              isSelected={isSelected(work)}
              onToggle={handleCiteSelection}
            />
          ))
        ) : !suggestionsLoading ? (
          <OpenAlexCitationEmptyState />
        ) : null}
      </Stack>
    </Stack>
  );
};
