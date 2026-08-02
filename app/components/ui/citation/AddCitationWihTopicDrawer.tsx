import { Icon } from "#app/components/icon";
import {
  Button,
  Drawer,
  Stack,
  Group,
  Box,
  Textarea,
  Text,
  ActionIcon,
  Tooltip,
  Accordion,
  TextInput,
  Grid,
} from "@mantine/core";
import { z } from "zod";
import { useForm, getInputProps, getFormProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Form, useFetcher } from "@remix-run/react";
import { useDisclosure } from "@mantine/hooks";
import React, { useState } from "react";
import AddCiteModal from "./AddCiteModal";
import classes from "./AddCitationDrawer.module.css";
import { ExtendedCitation } from "#app/services/paper.server";
import { EditIntroductionActionData } from "#app/routes/paper+/$paperId+/introduction+/form";
import { Cite, citeSchema } from "./MendeleyCiteForm";
import { generateReference } from "#app/utils/generateReference";

// Update the schema to include topics
export const addCitationWithTopicsSchema = z.object({
  topics: z.array(
    z.object({
      name: z.string().min(1),
      statements: z.array(
        z.object({
          id: z.string().min(1).optional(),
          text: z.string().min(1),
          cites: citeSchema.shape.cites,
        })
      ),
    })
  ),
});

export const AddCitationWithTopicDrawer = ({
  closeDrawer,
  drawerOpened,
  paperId,
  citations,
}: {
  closeDrawer: () => void;
  drawerOpened: boolean;
  paperId: string;
  citations: ExtendedCitation[] | undefined;
}) => {
  const [citeModalOpened, { open: openCiteModal, close: closeCiteModal }] =
    useDisclosure(false);

  const [currentCiteStatementIndex, setCurrentCiteStatementIndex] = useState<{
    topicIndex: number;
    statementIndex: number;
  } | null>(null);

  const groupedCitations = citations?.reduce((acc, citation) => {
    const topic = citation.topic || "";
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(citation);
    return acc;
  }, {} as Record<string, ExtendedCitation[]>);

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: addCitationWithTopicsSchema });
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    defaultValue: {
      topics:
        groupedCitations && Object.keys(groupedCitations).length > 0
          ? Object.entries(groupedCitations).map(
              ([topicName, topicCitations]) => ({
                name: topicName,
                statements: topicCitations.map((citation) => ({
                  id: citation.id || undefined,
                  text: citation.statement_text || undefined,
                  cites:
                    citation.cites?.map((cite) => ({
                      year: cite.year || undefined,
                      title: cite.title || undefined,
                      source: cite.source || undefined,
                      authors:
                        cite.authors?.map((author) => ({
                          last_name: author.last_name || undefined,
                          first_name: author.first_name || undefined,
                        })) || undefined,
                      doi: cite.doi || undefined,
                      mendeley_id: cite.mendeley_id || undefined,
                      reference_type: cite.reference_type || undefined,
                    })) || undefined,
                })),
              })
            )
          : [
              {
                name: "",
                statements: [
                  {
                    id: undefined,
                    text: "",
                    cites: undefined,
                  },
                ],
              },
            ],
    },
  });

  const onAddCitePressed = (topicIndex: number, statementIndex: number) => {
    setCurrentCiteStatementIndex({ topicIndex, statementIndex });
    openCiteModal();
  };

  const onCiteSelected = (statementIndex: number, cites: Cite[]) => {
    if (currentCiteStatementIndex === null) return;

    const { topicIndex } = currentCiteStatementIndex;
    const topicList = fields.topics.getFieldList();
    const topicFieldset = topicList[topicIndex]?.getFieldset();
    const statementsList = topicFieldset?.statements.getFieldList();
    const statementValue = statementsList?.[statementIndex]?.value;

    if (!topicFieldset || !statementValue) return;

    form.update({
      name: topicFieldset.statements.name,
      index: statementIndex,
      value: {
        ...statementValue,
        cites,
      },
    });
    closeCiteModal();
  };

  const handleRemoveCiteForIndex = (
    topicIndex: number,
    statementIndex: number,
    citeIndex: number
  ) => {
    const topicList = fields.topics.getFieldList();
    const topicFieldset = topicList[topicIndex]?.getFieldset();
    const statementsList = topicFieldset?.statements.getFieldList();
    const statementFieldset = statementsList?.[statementIndex]?.getFieldset();

    if (!statementFieldset) return;

    form.remove({
      name: statementFieldset.cites.name,
      index: citeIndex,
    });
  };

  const removeCitationFetcher = useFetcher<EditIntroductionActionData>();

  const addNewTopic = () => {
    form.insert({
      name: fields.topics.name,
      defaultValue: {
        name: "",
        statements: [
          {
            text: "",
            cites: [],
          },
        ],
      },
    });
  };

  const removeTopic = (topicIndex: number) => {
    form.remove({
      name: fields.topics.name,
      index: topicIndex,
    });
  };

  const topics = fields.topics.getFieldList();

  const [openedAccordionItem, setOpenedAccordionItem] = useState<string | null>(
    "topic-0"
  );

  const handleAccordionChange = (value: string | null) => {
    setOpenedAccordionItem(value);
  };

  return (
    <Drawer
      data-autofocus={true}
      closeOnEscape={!citeModalOpened}
      offset={8}
      radius="md"
      opened={drawerOpened}
      onClose={closeDrawer}
      title="Add citation"
      position="right"
      trapFocus
      styles={{
        body: {
          height: "calc(100% - 75px)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <AddCiteModal
        opened={citeModalOpened}
        onClose={closeCiteModal}
        currentCiteStatementIndex={currentCiteStatementIndex?.statementIndex ?? 0}
        key={currentCiteStatementIndex?.topicIndex}
        onCiteSelected={onCiteSelected}
        paperId={paperId}
      />
      <Form
        {...getFormProps(form)}
        method="post"
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Box
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: "var(--mantine-spacing-md)",
          }}
        >
          <Stack gap="xs">
            <Accordion
              value={openedAccordionItem}
              onChange={handleAccordionChange}
              variant="contained"
              chevronPosition="left"
              classNames={{
                item: classes.accordionItem,
                control: classes.accordionControl,
                content: classes.accordionContent,
                chevron: classes.accordionChevron,
              }}
            >
              {topics.map((topic, topicIndex) => {
                const topicFields = topic.getFieldset();
                const statements = topicFields.statements.getFieldList();
                const statementsFieldName = topicFields.statements.name;

                const noCitesYetErrors = statements.some((statement) => {
                  const statementFields = statement.getFieldset();
                  return statementFields.cites.errors?.some((error) =>
                    error.includes("Cites is empty")
                  );
                });

                const hasCiteTitleRequiredError = statements.some(
                  (statement) => {
                    const statementFields = statement.getFieldset();
                    return statementFields.cites
                      .getFieldList()
                      .some((cite) =>
                        cite
                          .getFieldset()
                          .title.errors?.some((error) =>
                            error.toLowerCase().includes("required")
                          )
                      );
                  }
                );

                return (
                  <Accordion.Item key={topic.key} value={`topic-${topicIndex}`}>
                    <Grid
                      justify="space-between"
                      align="center"
                      pb="md"
                      pt="md"
                    >
                      <Grid.Col span={1}>
                        <Accordion.Control
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "transparent",
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span="auto">
                        <Grid align="center">
                          <Grid.Col span="auto">
                            <TextInput
                              data-autofocus
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              placeholder="Deductive"
                              {...getInputProps(topicFields.name, {
                                type: "text",
                              })}
                              error={
                                topicFields.name.errors ||
                                hasCiteTitleRequiredError ||
                                noCitesYetErrors
                                  ? true
                                  : false
                              }
                              key={topicFields.name.key}
                            />
                          </Grid.Col>
                          <Grid.Col
                            span={2}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <ActionIcon
                              component="div"
                              disabled={
                                topics.length === 1 ||
                                topic
                                  .getFieldset()
                                  .statements.getFieldList()
                                  .some(
                                    (statement) =>
                                      statement.getFieldset().id.value
                                  )
                              }
                              color="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  topics.length === 1 ||
                                  topic
                                    .getFieldset()
                                    .statements.getFieldList()
                                    .some(
                                      (statement) =>
                                        statement.getFieldset().id.value
                                    )
                                ) {
                                  null;
                                } else {
                                  removeTopic(topicIndex);
                                }
                              }}
                            >
                              <Icon
                                name="trash-outline"
                                style={{ width: "20px", height: "20px" }}
                              />
                              disabled
                            </ActionIcon>
                          </Grid.Col>
                        </Grid>
                      </Grid.Col>
                    </Grid>

                    <Accordion.Panel>
                      <Stack gap={5}>
                        {statements.map((statement, statementIndex) => {
                          const statementFields = statement.getFieldset();

                          const noCitesYetErrorsTwo =
                            statementFields.cites.errors?.some((error) =>
                              error.includes("Cites is empty")
                            ) ?? false;

                          const hasCiteTitleRequiredErrorTwo =
                            statementFields.cites
                              .getFieldList()
                              .some((cite) =>
                                cite
                                  .getFieldset()
                                  .title.errors?.some((error) =>
                                    error.toLowerCase().includes("required")
                                  )
                              );

                          return (
                            <Box
                              key={statement.key}
                              className={classes.statement}
                            >
                              <Stack gap={5}>
                                <Group gap="xs" justify="space-between">
                                  <Group gap={5}>
                                    <Tooltip
                                      transitionProps={{
                                        transition: "skew-up",
                                        duration: 300,
                                      }}
                                      openDelay={300}
                                      color="var(--mantine-color-black)"
                                      label={
                                        <Text
                                          size="xs"
                                          fw={500}
                                          c="var(--mantine-color-gray-3)"
                                        >
                                          Delete statement
                                        </Text>
                                      }
                                    >
                                      {statementFields.id.value ? (
                                        <ActionIcon
                                          size="xs"
                                          disabled={statements.length === 1}
                                          variant="light"
                                          color="red"
                                          name="intent"
                                          tabIndex={-1}
                                          value="removeCitation"
                                          type="submit"
                                          onClick={(event) => {
                                            event.preventDefault();
                                            const formData = new FormData();
                                            formData.append("paperId", paperId);
                                            formData.append(
                                              "citationId",
                                              statementFields.id.value || ""
                                            );
                                            formData.append(
                                              "intent",
                                              "removeCitation"
                                            );
                                            removeCitationFetcher.submit(
                                              formData,
                                              {
                                                method: "post",
                                                action: `/paper/${paperId}/introduction/form`,
                                                preventScrollReset: true,
                                              }
                                            );
                                          }}
                                        >
                                          <Icon
                                            name="pika-delete"
                                            style={{
                                              width: "16px",
                                              height: "16px",
                                            }}
                                          />
                                        </ActionIcon>
                                      ) : (
                                        <ActionIcon
                                          size="xs"
                                          disabled={statements.length === 1}
                                          variant="light"
                                          tabIndex={-1}
                                          color="red"
                                          type="submit"
                                          {...form.remove.getButtonProps({
                                            name: statementsFieldName,
                                            index: statementIndex,
                                          })}
                                        >
                                          <Icon
                                            name="pika-delete"
                                            style={{
                                              width: "16px",
                                              height: "16px",
                                            }}
                                          />
                                        </ActionIcon>
                                      )}
                                    </Tooltip>
                                    <Text size="xs" fw={500}>
                                      Statement {statementIndex + 1}
                                    </Text>
                                  </Group>
                                  <Group gap="xs">
                                    {hasCiteTitleRequiredErrorTwo ||
                                    noCitesYetErrorsTwo ? (
                                      <Text size="xs" fw={500} c="red.8">
                                        Please link a cite first →
                                      </Text>
                                    ) : null}
                                    <Button
                                      tabIndex={-1}
                                      color={
                                        hasCiteTitleRequiredErrorTwo ||
                                        noCitesYetErrorsTwo
                                          ? "red.8"
                                          : undefined
                                      }
                                      size="compact-xs"
                                      variant="light"
                                      onClick={() =>
                                        onAddCitePressed(
                                          topicIndex,
                                          statementIndex
                                        )
                                      }
                                    >
                                      <Group gap={5}>
                                        <Icon
                                          name="pika-receipt"
                                          style={{
                                            width: "16px",
                                            height: "16px",
                                          }}
                                        />
                                        Link cite
                                      </Group>
                                    </Button>
                                  </Group>
                                </Group>

                                <Stack gap={5}>
                                  <Textarea
                                    placeholder="Paste your statement here"
                                    data-autofocus
                                    size="xs"
                                    autosize
                                    minRows={3}
                                    {...getInputProps(statementFields.text, {
                                      type: "text",
                                    })}
                                    key={statementFields.text.key}
                                    error={statementFields.text.errors}
                                  />
                                  {statementFields.cites.getFieldList().length >
                                    0 && (
                                    <>
                                      {statementFields.cites
                                        .getFieldList()
                                        .map((cite, index) => {
                                          const citeFields = cite.getFieldset();
                                          // Only generate and display the reference if there's actual data
                                          if (
                                            citeFields.year.value &&
                                            citeFields.authors.getFieldList()
                                              .length > 0
                                          ) {
                                            const reference = generateReference(
                                              {
                                                year:
                                                  citeFields.year.value ||
                                                  "9999",
                                                authors: citeFields.authors
                                                  .getFieldList()
                                                  .map((author) => ({
                                                    first_name:
                                                      author.getFieldset()
                                                        .first_name.value,
                                                    last_name:
                                                      author.getFieldset()
                                                        .last_name.value,
                                                  })),
                                              }
                                            );
                                            return (
                                              <Box
                                                key={cite.key}
                                                className={
                                                  classes.citationPreview
                                                }
                                              >
                                                <Grid
                                                  gutter="xs"
                                                  align="center"
                                                >
                                                  <Grid.Col span="auto">
                                                    <Text size="xs">
                                                      <Text
                                                        span
                                                        fw={700}
                                                        size="xs"
                                                      >
                                                        Cite:{" "}
                                                      </Text>{" "}
                                                      {reference}
                                                    </Text>
                                                  </Grid.Col>
                                                  <Grid.Col
                                                    span={2}
                                                    style={{
                                                      display: "flex",
                                                      justifyContent:
                                                        "flex-end",
                                                    }}
                                                  >
                                                    <Tooltip
                                                      transitionProps={{
                                                        transition:
                                                          "slide-down",
                                                        duration: 50,
                                                      }}
                                                      openDelay={300}
                                                      color="var(--mantine-color-black)"
                                                      label={
                                                        <Text
                                                          size="xs"
                                                          fw={500}
                                                          c="var(--mantine-color-gray-3)"
                                                        >
                                                          Remove cite
                                                        </Text>
                                                      }
                                                    >
                                                      <Button
                                                        size="compact-xs"
                                                        color="gray"
                                                        variant="light"
                                                        onClick={() =>
                                                          handleRemoveCiteForIndex(
                                                            topicIndex,
                                                            statementIndex,
                                                            index
                                                          )
                                                        }
                                                      >
                                                        <Icon
                                                          name="x-outline"
                                                          style={{
                                                            width: "16px",
                                                            height: "16px",
                                                          }}
                                                        />
                                                      </Button>
                                                    </Tooltip>
                                                  </Grid.Col>
                                                </Grid>
                                              </Box>
                                            );
                                          }
                                          return null;
                                        })}
                                    </>
                                  )}
                                </Stack>
                              </Stack>
                              <input
                                placeholder="ID"
                                {...getInputProps(statementFields.id, {
                                  type: "hidden",
                                })}
                                key={statementFields.id.key}
                              />

                              {statementFields.cites
                                .getFieldList()
                                .map((cite) => {
                                  const citeFields = cite.getFieldset();
                                  return (
                                    <React.Fragment key={cite.key}>
                                      <input
                                        placeholder="Year"
                                        {...getInputProps(citeFields.year, {
                                          type: "hidden",
                                        })}
                                        key={citeFields.year.key}
                                      />
                                      <input
                                        placeholder="Title"
                                        {...getInputProps(citeFields.title, {
                                          type: "hidden",
                                        })}
                                        key={citeFields.title.key}
                                      />
                                      <input
                                        placeholder="Source"
                                        {...getInputProps(citeFields.source, {
                                          type: "hidden",
                                        })}
                                        key={citeFields.source.key}
                                      />
                                      <input
                                        placeholder="DOI"
                                        {...getInputProps(citeFields.doi, {
                                          type: "hidden",
                                        })}
                                        key={citeFields.doi.key}
                                      />
                                      {citeFields.authors
                                        .getFieldList()
                                        .map((author) => {
                                          const authorFields =
                                            author.getFieldset();
                                          return (
                                            <Group key={author.key} grow>
                                              <input
                                                {...getInputProps(
                                                  authorFields.first_name,
                                                  {
                                                    type: "hidden",
                                                  }
                                                )}
                                                key={
                                                  authorFields.first_name.key
                                                }
                                              />
                                              <input
                                                placeholder="Last Name"
                                                {...getInputProps(
                                                  authorFields.last_name,
                                                  {
                                                    type: "hidden",
                                                  }
                                                )}
                                                key={authorFields.last_name.key}
                                              />
                                            </Group>
                                          );
                                        })}
                                    </React.Fragment>
                                  );
                                })}
                            </Box>
                          );
                        })}
                        <Box
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            paddingTop: "5px",
                          }}
                        >
                          <Button
                            size="compact-sm"
                            variant="light"
                            color="gray"
                            style={{
                              borderRadius: "9999px",
                            }}
                            onClick={() =>
                              form.insert({
                                name: topicFields.statements.name,
                                defaultValue: {
                                  text: "",
                                  cites: [{}],
                                },
                              })
                            }
                          >
                            <Text size="xs" fw={500}>
                              Add Statement
                            </Text>
                          </Button>
                        </Box>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
            <Button variant="subtle" onClick={addNewTopic}>
              <Group gap={5}>
                <Icon
                  name="square-rounded-plus-outline"
                  style={{ width: "16px", height: "16px" }}
                />
                Add New Deductive
              </Group>
            </Button>
            <input type="hidden" name="paperId" value={paperId} />
          </Stack>
        </Box>
        <Box
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <Button name="intent" value="addCitation" type="submit" fullWidth>
            Submit
          </Button>
        </Box>
      </Form>
    </Drawer>
  );
};
