import { GetMendeleyCitationsByQueryLoaderData } from "#app/routes/resources+/mendeley+/_index";
import {
  Badge,
  Box,
  Button,
  Group,
  Highlight,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useFetcher } from "@remix-run/react";
import classes from "./MendeleyCiteForm.module.css";
import { MendeleyCitationEmptyState } from "./MendeleyCitationEmptyState";
import { z } from "zod";
import React from "react";
import { useCitationStore } from "#app/stores/citationStore";
import { MendeleyCitation } from "#app/services/mendeley.server";

export const citeSchema = z.object({
  cites: z
    .array(
      z.object({
        year: z.string().min(1),
        title: z.string().min(1),
        source: z.string().min(1).optional(),
        doi: z.string().min(1).optional(),
        mendeley_id: z.string().min(1).optional(),
        openalex_id: z.string().min(1).optional(),
        reference_type: z.string().min(1).optional(),
        authors: z.array(
          z.object({
            first_name: z.string().min(1).optional(),
            last_name: z.string().min(1),
          })
        ),
      })
    )
    .min(1, "Cites is empty"),
});

export type Cite = z.infer<typeof citeSchema>["cites"][number];

export const MendeleyCiteForm = () => {
  const {
    mendeleyCiteFormState,
    setMendeleyCiteFormState,
    setSearchResults,
    addSelectedCite,
    removeSelectedCite,
  } = useCitationStore();

  const searchCitationFetcher =
    useFetcher<GetMendeleyCitationsByQueryLoaderData>();

  React.useEffect(() => {
    if (searchCitationFetcher.data) {
      setSearchResults(searchCitationFetcher.data.citations);
    }
  }, [searchCitationFetcher.data, setSearchResults]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchCitationFetcher.submit(
      { query: mendeleyCiteFormState.searchQuery },
      { method: "get", action: "/resources/mendeley" }
    );
  };

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMendeleyCiteFormState({ searchQuery: event.target.value });
  };

  const handleCiteSelection = (mendeleyCitation: MendeleyCitation) => {
    const isSelected = mendeleyCiteFormState.selectedCites.some(
      (selectedCite) => selectedCite.mendeley_id === mendeleyCitation.id
    );
    if (isSelected) {
      removeSelectedCite(mendeleyCitation.id);
    } else {
      addSelectedCite({
        source: mendeleyCitation.source,
        title: mendeleyCitation.title,
        year: mendeleyCitation.year.toString(),
        doi: mendeleyCitation.identifiers?.doi,
        authors: mendeleyCitation.authors
          .filter(
            (author): author is { last_name: string; first_name?: string } =>
              typeof author.last_name === "string"
          )
          .map(({ last_name, first_name }) => ({ last_name, first_name })),
        mendeley_id: mendeleyCitation.id,
      });
    }
  };

  return (
    <Stack>
      <form onSubmit={handleSearch}>
        <TextInput
          placeholder="Search for a citation"
          required
          data-autofocus
          autoFocus
          name="query"
          value={mendeleyCiteFormState.searchQuery}
          onChange={handleSearchInputChange}
          rightSectionProps={{ style: { paddingRight: "0.3rem" } }}
          rightSection={
            <Button
              size="compact-sm"
              type="submit"
              loading={searchCitationFetcher.state !== "idle"}
            >
              <Text size="sm" fw={500}>
                Search
              </Text>
            </Button>
          }
          rightSectionWidth="auto"
        />
      </form>
      <Stack gap={5}>
        {mendeleyCiteFormState.searchResults &&
        mendeleyCiteFormState.searchResults.length > 0 ? (
          mendeleyCiteFormState.searchResults.map((cite) => (
            <Box
              key={cite.citation.id}
              className={classes.citationCard}
              mod={
                mendeleyCiteFormState.selectedCites.some(
                  (selectedCite) =>
                    selectedCite.mendeley_id === cite.citation.id
                )
                  ? { selected: true }
                  : {}
              }
            >
              <Stack gap={5}>
                <Group justify="space-between">
                  <Text size="xs" fw={500} c="var(--mantine-primary-color-4)">
                    {cite.citation.year}
                  </Text>
                  {mendeleyCiteFormState.selectedCites.some(
                    (selectedCite) =>
                      selectedCite.mendeley_id === cite.citation.id
                  ) ? (
                    <Badge size="xs" color="green.8">
                      Selected
                    </Badge>
                  ) : null}
                </Group>
                <Text size="xs" fw={500} component="span">
                  <Highlight highlight={cite.highlight}>
                    {cite.highlighted?.title}
                  </Highlight>
                </Text>
                {cite.highlighted.abstract && (
                  <Text size="xs" c="dark.1" component="span">
                    <Highlight highlight={cite.highlight}>
                      {cite.highlighted.abstract}
                    </Highlight>
                  </Text>
                )}
                {cite.highlighted.authors && (
                  <Text
                    size="xs"
                    c="dark.3"
                    fw={400}
                    fs="italic"
                    component="span"
                  >
                    <Highlight highlight={cite.highlight}>
                      {cite.highlighted.authors}
                    </Highlight>
                  </Text>
                )}
              </Stack>
              <div className={classes.overlay}>
                <Button
                  onClick={() => handleCiteSelection(cite.citation!)}
                  className={classes.addButton}
                  size="xs"
                  type="button"
                >
                  {mendeleyCiteFormState.selectedCites.some(
                    (selectedCite) =>
                      selectedCite.mendeley_id === cite.citation.id
                  )
                    ? "Unselect"
                    : "Select"}
                </Button>
              </div>
            </Box>
          ))
        ) : searchCitationFetcher.state === "idle" &&
          (searchCitationFetcher.data === null ||
            searchCitationFetcher.data?.citations?.length === 0) ? (
          <MendeleyCitationEmptyState />
        ) : null}
      </Stack>
    </Stack>
  );
};
