import { useCitationStore } from "#app/stores/citationStore";
import React from "react";
import { z } from "zod";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Collapse,
  Fieldset,
  Grid,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Badge,
} from "@mantine/core";

import { Cite } from "./MendeleyCiteForm";
import { OpenAlexSuggestionForm } from "./OpenAlexSuggestionForm";
import { useDisclosure } from "@mantine/hooks";
import { Icon } from "#app/components/icon";
import classes from "./AddCiteModal.module.css";
import { generateReference } from "#app/utils/generateReference";

const schema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  source: z.string().min(1),
  doi: z.string().min(1).optional(),
  authors: z.array(
    z.object({
      first_name: z
        .string()
        .min(1)
        .transform((s) => s.charAt(0).toUpperCase() + s.slice(1)),
      last_name: z
        .string()
        .min(1)
        .transform((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    })
  ),
});

export const AddCiteModal = ({
  opened,
  onClose,
  currentCiteStatementIndex,
  onCiteSelected,
  paperId,
  section,
}: {
  opened: boolean;
  onClose: () => void;
  currentCiteStatementIndex: number;
  onCiteSelected: (statementIndex: number, cites: Cite[]) => void;
  paperId?: string;
  section?: string;
}) => {
  const { activeTab, setActiveTab, resetStore, citeFormState, removeSelectedCite } =
    useCitationStore();

  const [selectedCitesOpened, { toggle: toggleSelectedCites }] =
    useDisclosure(false);

  const handleClose = () => {
    resetStore();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add citation"
      trapFocus
      size="lg"
      styles={{
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          maxHeight: "80vh", // Fixed height
        },
      }}
    >
      <Box p="sm" pt={0} pb="sm">
        <SegmentedControl
          value={activeTab}
          onChange={(value) => setActiveTab(value as "search" | "manual")}
          data={[
            { label: "Search", value: "search" },
            { label: "Manual", value: "manual" },
          ]}
          fullWidth
        />
      </Box>

      <Box
        style={{
          flex: 1,
          padding: "var(--mantine-spacing-sm)",
          overflowY: "auto",
        }}
      >
        <Stack>
          {activeTab === "search" &&
            (paperId ? (
              <OpenAlexSuggestionForm paperId={paperId} section={section} />
            ) : (
              <Box className={classes.mendeleyNotLinked}>
                <Center style={{ height: "100%" }}>
                  <Text ta="center">
                    Search is unavailable without a paper context.
                  </Text>
                </Center>
              </Box>
            ))}
          {activeTab === "manual" && <ManualCitationForm />}
        </Stack>
      </Box>

      <Box
        p="sm"
        style={{
          borderTop: "1px solid var(--mantine-primary-color-6)",
          backgroundColor: "var(--mantine-primary-color-8)",
          boxShadow: "var(--mantine-shadow-xl)",
        }}
      >
        <Grid gutter="xs">
          {citeFormState.selectedCites.length > 0 && (
            <Grid.Col span={12}>
              <Center style={{ marginBottom: 10 }}>
                <Group gap={5}>
                  <ActionIcon
                    onClick={toggleSelectedCites}
                    size="xs"
                    color="var(--mantine-primary-color-9)"
                  >
                    <Icon
                      name={
                        selectedCitesOpened
                          ? "chevron-down-outline"
                          : "chevron-up-outline"
                      }
                      style={{ width: 16, height: 16 }}
                    />
                  </ActionIcon>
                  <Text size="xs" c="white">
                    {citeFormState.selectedCites.length} citations
                    selected
                  </Text>
                </Group>
              </Center>
              <Collapse in={selectedCitesOpened}>
                <Box mb="md">
                  <Table
                    highlightOnHover
                    striped
                    classNames={{ table: classes.citationTable }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: "78%" }}>
                          <Text fz="xs" fw="bold">
                            Citation
                          </Text>
                        </Table.Th>
                        <Table.Th style={{ width: "22%" }}></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {citeFormState.selectedCites.map((cite) => (
                        <React.Fragment key={cite.title}>
                          <Table.Tr key={cite.title}>
                            <Table.Td>
                              <Text size="xs">{generateReference(cite)}</Text>
                            </Table.Td>

                            <Table.Td>
                              <Group gap={5} justify="end">
                                <Badge
                                  size="xs"
                                  variant="dot"
                                  color={
                                    cite.mendeley_id
                                      ? "green"
                                      : cite.openalex_id
                                        ? "blue"
                                        : "gray"
                                  }
                                >
                                  {cite.mendeley_id
                                    ? "Mendeley"
                                    : cite.openalex_id
                                      ? "Suggested"
                                      : "Manual"}
                                </Badge>
                                <Button
                                  size="compact-xs"
                                  color="var(--mantine-color-dark-7)"
                                  onClick={() => {
                                    removeSelectedCite(
                                      cite.mendeley_id ||
                                        cite.openalex_id ||
                                        cite.title
                                    );
                                  }}
                                >
                                  <Icon
                                    name="pika-link-broken"
                                    style={{ width: 16, height: 16 }}
                                  />
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        </React.Fragment>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              </Collapse>
            </Grid.Col>
          )}
          <Grid.Col span={2}>
            <Button
              variant="subtle"
              color="white"
              fullWidth
              onClick={handleClose}
            >
              Cancel
            </Button>
          </Grid.Col>
          <Grid.Col span="auto">
            <Button
              variant="default"
              color="var(--mantine-primary-color-9)"
              fullWidth
              type="submit"
              disabled={citeFormState.selectedCites.length === 0}
              onClick={() => {
                onCiteSelected(
                  currentCiteStatementIndex,
                  citeFormState.selectedCites
                );
                handleClose();
              }}
            >
              Link selected citations
            </Button>
          </Grid.Col>
        </Grid>
      </Box>
    </Modal>
  );
};

const ManualCitationForm = () => {
  const { addSelectedCite, citeFormState } = useCitationStore();

  const [form, fields] = useForm({
    id: `manual-citation-form-${citeFormState.selectedCites.length}`,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    defaultValue: {
      year: "",
      title: "",
      source: "",
      doi: "",
      authors: [
        {
          first_name: "",
          last_name: "",
        },
      ],
    },
    onSubmit(event, { submission }) {
      event.preventDefault();
      if (submission && submission.status === "success") {
        const formData = submission.value;
        addSelectedCite({
          ...formData,
          doi: formData.doi || undefined,
          authors: formData.authors.map((author) => ({
            first_name: author.first_name || "",
            last_name: author.last_name || "",
          })),
        });

        // Reset all fields to their initial values
        form.update({
          name: fields.year.name,
          value: "xxx",
        });
      }
    },
  });

  const authors = fields.authors.getFieldList();

  return (
    <form {...getFormProps(form)}>
      <Stack gap="xs">
        <TextInput
          label="Title"
          placeholder="Enter the title"
          {...getInputProps(fields.title, { type: "text" })}
          key={fields.title.key}
          required
          data-autofocus
          autoFocus
          error={fields.title.errors}
        />
        <TextInput
          label="Year"
          placeholder="Enter the publication year"
          {...getInputProps(fields.year, { type: "text" })}
          key={fields.year.key}
          required
          error={fields.year.errors}
        />
        <TextInput
          label="Source"
          placeholder="Enter the source"
          {...getInputProps(fields.source, { type: "text" })}
          key={fields.source.key}
          required
          error={fields.source.errors}
        />
        <TextInput
          label="DOI"
          placeholder="Enter the DOI (optional)"
          {...getInputProps(fields.doi, { type: "text" })}
          key={fields.doi.key}
          error={fields.doi.errors}
        />
        {authors.map((author, index) => {
          const authorFields = author.getFieldset();
          return (
            <Fieldset legend={`Author ${index + 1}`} key={author.key}>
              <Stack>
                <Group key={author.key} grow>
                  <TextInput
                    label="First Name"
                    placeholder="Enter first name"
                    {...getInputProps(authorFields.first_name, {
                      type: "text",
                    })}
                    key={authorFields.first_name.key}
                    required
                    error={
                      authorFields.first_name.errors?.length &&
                      authorFields.first_name.errors.length > 0
                        ? true
                        : false
                    }
                  />
                  <TextInput
                    label="Last Name"
                    placeholder="Enter last name"
                    {...getInputProps(authorFields.last_name, { type: "text" })}
                    key={authorFields.last_name.key}
                    required
                    error={
                      authorFields.last_name.errors?.length &&
                      authorFields.last_name.errors.length > 0
                        ? true
                        : false
                    }
                  />
                </Group>

                <Button
                  variant="outline"
                  size="compact-md"
                  disabled={index === 0}
                  type="submit"
                  color="red"
                  tabIndex={-1}
                  {...form.remove.getButtonProps({
                    name: fields.authors.name,
                    index,
                  })}
                >
                  <Text size="xs">Remove Author</Text>
                </Button>
              </Stack>
            </Fieldset>
          );
        })}
        <Box style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="compact-xs"
            color="gray"
            variant="light"
            type="submit"
            {...form.insert.getButtonProps({
              name: fields.authors.name,
              defaultValue: { first_name: "", last_name: "" },
            })}
            tabIndex={-1}
          >
            Add Author
          </Button>
        </Box>
        <Button type="submit">Add Citation</Button>
      </Stack>
    </form>
  );
};

export default AddCiteModal;
