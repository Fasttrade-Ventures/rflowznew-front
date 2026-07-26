import {
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useFetcher } from "@remix-run/react";
import React from "react";
import classes from "./MendeleyCiteForm.module.css";
import { OpenAlexCitationEmptyState } from "./OpenAlexCitationEmptyState";
import { useCitationStore } from "#app/stores/citationStore";
import type { OpenAlexWork } from "#app/services/openalex.server";
import type { SuggestOpenAlexCitationsActionData } from "#app/routes/resources+/openalex+/_index";

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
    mendeleyCiteFormState,
    addSelectedCite,
    removeSelectedCite,
  } = useCitationStore();

  const suggestFetcher = useFetcher<SuggestOpenAlexCitationsActionData>();

  React.useEffect(() => {
    if (suggestFetcher.data) {
      setOpenAlexSuggestions(suggestFetcher.data.suggestions);
      setOpenAlexSuggestionsLoading(false);
    }
  }, [suggestFetcher.data, setOpenAlexSuggestions, setOpenAlexSuggestionsLoading]);

  const handleFetchSuggestions = () => {
    setOpenAlexSuggestionsLoading(true);
    suggestFetcher.submit(
      { paperId, section: section ?? "" },
      { method: "post", action: "/resources/openalex" }
    );
  };

  const handleCiteSelection = (work: OpenAlexWork) => {
    const isSelected = mendeleyCiteFormState.selectedCites.some(
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
  const loading =
    openAlexSuggestionState.loading || suggestFetcher.state !== "idle";

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Ranked academic sources for this paper&apos;s topic
        </Text>
        <Button size="compact-sm" onClick={handleFetchSuggestions} loading={loading}>
          {suggestions ? "Refresh suggestions" : "Get suggestions"}
        </Button>
      </Group>
      <Stack gap={5}>
        {suggestions && suggestions.length > 0 ? (
          suggestions.map(({ work, reason }) => {
            const isSelected = mendeleyCiteFormState.selectedCites.some(
              (selectedCite) => selectedCite.openalex_id === work.openalex_id
            );
            return (
              <Box
                key={work.openalex_id}
                className={classes.citationCard}
                mod={isSelected ? { selected: true } : {}}
              >
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
                  <Text size="xs" c="dimmed" component="span">
                    {reason}
                  </Text>
                </Stack>
                <div className={classes.overlay}>
                  <Button
                    onClick={() => handleCiteSelection(work)}
                    className={classes.addButton}
                    size="xs"
                    type="button"
                  >
                    {isSelected ? "Unselect" : "Select"}
                  </Button>
                </div>
              </Box>
            );
          })
        ) : !loading ? (
          <OpenAlexCitationEmptyState />
        ) : null}
      </Stack>
    </Stack>
  );
};
