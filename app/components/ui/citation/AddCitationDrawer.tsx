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

export const addCitationSchema = z.object({
  statement: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        text: z.string().min(1),
        topic: z.string().min(1).optional(),
        cites: citeSchema.shape.cites,
      })
    )
    .min(1),
});

export const AddCitationDrawer = ({
  closeDrawer,
  drawerOpened,
  paperId,
  citations,
  addCitationIntent = "addCitation",
}: {
  closeDrawer: () => void;
  drawerOpened: boolean;
  paperId: string;
  citations: ExtendedCitation[] | undefined;
  addCitationIntent?: string;
}) => {
  const [citeModalOpened, { open: openCiteModal, close: closeCiteModal }] =
    useDisclosure(false);

  const [currentCiteStatementIndex, setCurrentCiteStatementIndex] = useState<
    number | null
  >(null);

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: addCitationSchema });
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    defaultValue: {
      statement: citations?.length
        ? citations.map((citation) => ({
            id: String(citation.id) || "",
            text: citation.statement_text || "",
            topic: citation.topic || "",
            cites: citation.cites || [],
          }))
        : [
            {
              text: "",
              topic: "",
              cites: [],
            },
          ],
    },
  });

  console.log("MASUKKKK");

  console.log("FORM ERRORS", form.allErrors);
  console.log("FORM.VALUES", form.value);

  const onAddCitePressed = (statementIndex: number) => {
    setCurrentCiteStatementIndex(statementIndex);
    openCiteModal();
  };

  const onCiteSelected = (statementIndex: number, cites: Cite[]) => {
    setCurrentCiteStatementIndex(statementIndex);
    form.update({
      name: fields.statement.name,
      index: statementIndex,
      value: {
        ...fields.statement.getFieldList()[statementIndex].value,
        cites,
        // year: citeData.year,
        // title: citeData.title,
        // source: citeData.source,
        // doi: citeData.doi,
        // authors: citeData.authors,
      },
    });
    closeCiteModal();
  };

  const handleRemoveCiteForIndex = (
    statementIndex: number,
    citeIndex: number
  ) => {
    form.remove({
      name: fields.statement.getFieldList()[statementIndex].getFieldset().cites
        .name,
      index: citeIndex,
    });
  };

  const removeCitationFetcher = useFetcher<EditIntroductionActionData>();

  const statements = fields.statement.getFieldList();

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
        currentCiteStatementIndex={currentCiteStatementIndex!}
        key={currentCiteStatementIndex}
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
          <Stack>
            {statements.map((statement, statementIndex) => {
              const statementFields = statement.getFieldset();
              const cites = statementFields.cites.getFieldList();

              const hasCiteTitleRequiredError = cites.some((cite) =>
                cite
                  .getFieldset()
                  .title.errors?.some((error) =>
                    error.toLowerCase().includes("required")
                  )
              );

              const hasCitesEmptyError = statementFields.cites.errors?.some(
                (error) => error.includes("Cites is empty")
              );

              return (
                <Box key={statement.key} className={classes.statement}>
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
                              tabIndex={-1}
                              name="intent"
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
                                formData.append("intent", "removeCitation");
                                removeCitationFetcher.submit(formData, {
                                  method: "post",
                                  action: `/paper/${paperId}/introduction/form`,
                                  preventScrollReset: true,
                                });
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
                                name: fields.statement.name,
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
                        {(hasCiteTitleRequiredError || hasCitesEmptyError) && (
                          <Text size="xs" fw={500} c="red.8">
                            Please link a cite first →
                          </Text>
                        )}
                        <Button
                          color={
                            hasCiteTitleRequiredError || hasCitesEmptyError
                              ? "red.8"
                              : undefined
                          }
                          size="compact-xs"
                          variant="light"
                          tabIndex={-1}
                          onClick={() => onAddCitePressed(statementIndex)}
                        >
                          <Group gap={5}>
                            <Icon
                              name="pika-receipt"
                              style={{ width: "16px", height: "16px" }}
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
                        autoFocus
                        size="xs"
                        autosize
                        minRows={3}
                        {...getInputProps(statementFields.text, {
                          type: "text",
                        })}
                        key={statementFields.text.key}
                        error={statementFields.text.errors}
                      />
                      {cites.length > 0 && (
                        <>
                          {cites.map((cite, index) => {
                            const citeFields = cite.getFieldset();
                            if (
                              citeFields.year.value &&
                              citeFields.authors.getFieldList().length > 0
                            ) {
                              const reference = generateReference({
                                year: citeFields.year.value,
                                authors: citeFields.authors
                                  .getFieldList()
                                  .map((author) => ({
                                    first_name:
                                      author.getFieldset().first_name.value,
                                    last_name:
                                      author.getFieldset().last_name.value,
                                  })),
                              });
                              return (
                                <Box
                                  key={cite.key}
                                  className={classes.citationPreview}
                                >
                                  <Grid gutter="xs" align="center">
                                    <Grid.Col span={10}>
                                      <Text size="xs">
                                        <Text span fw={700} size="xs">
                                          Cite:{" "}
                                        </Text>{" "}
                                        {reference}
                                      </Text>
                                    </Grid.Col>
                                    <Grid.Col
                                      span={2}
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      <Tooltip
                                        transitionProps={{
                                          transition: "slide-down",
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

                  {cites.map((cite) => {
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
                        <input
                          placeholder="Reference type"
                          {...getInputProps(citeFields.reference_type, {
                            type: "hidden",
                          })}
                          key={citeFields.reference_type.key}
                        />
                        <input
                          placeholder="Mendeley ID"
                          {...getInputProps(citeFields.mendeley_id, {
                            type: "hidden",
                          })}
                          key={citeFields.mendeley_id.key}
                        />
                        <input
                          placeholder="OpenAlex ID"
                          {...getInputProps(citeFields.openalex_id, {
                            type: "hidden",
                          })}
                          key={citeFields.openalex_id.key}
                        />
                        {citeFields.authors.getFieldList().map((author) => {
                          const authorFields = author.getFieldset();
                          return (
                            <Group key={author.key} grow>
                              <input
                                {...getInputProps(authorFields.first_name, {
                                  type: "hidden",
                                })}
                                key={authorFields.first_name.key}
                              />
                              <input
                                placeholder="Last Name"
                                {...getInputProps(authorFields.last_name, {
                                  type: "hidden",
                                })}
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
            <Box style={{ display: "flex", justifyContent: "center" }}>
              <Button
                className={classes.addStatementButton}
                size="xs"
                variant="outline"
                type="submit"
                {...form.insert.getButtonProps({
                  name: fields.statement.name,
                  defaultValue: {
                    text: "",
                    cites: [{}],
                  },
                })}
              >
                <Group gap={5}>
                  <Icon
                    name="plus-outline"
                    style={{ width: "16px", height: "16px" }}
                  />
                  <Text size="xs" fw={500}>
                    Add Statement
                  </Text>
                </Group>
              </Button>
            </Box>
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
          <Button
            name="intent"
            value={addCitationIntent}
            type="submit"
            fullWidth
          >
            Submit
          </Button>
        </Box>
      </Form>
    </Drawer>
  );
};
