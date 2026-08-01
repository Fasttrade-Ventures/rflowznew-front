import { AIGenerationModal } from "#app/components/ui/modal/AIGenerationModal";
import { useIsPending } from "#app/utils/misc";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Grid,
  Group,
  Radio,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Form } from "@remix-run/react";
import React, { useState } from "react";
import { z } from "zod";
import { CDivider } from "../CDivider";
import { LanguageSelect } from "./LanguageSelect";
import classes from "./PaperForm.module.css";
import toClasses from "./TangibleOutputRadioGroup.module.css";
import { Icon } from "#app/components/icon";
import { NewPaperData } from "#app/routes/paper+/new+/_index";
import { normalizeKeywords } from "#app/utils/normalize-keywords";

// Define the tangible output type
type TangibleOutput =
  | { type: "Framework" }
  | { type: "System" }
  | { type: "Model" }
  | { type: "Application" }
  | { type: "Others"; description: string };

const tangibleOutputOptions = [
  {
    name: "Framework",
    description:
      "A framework is a reusable structure that provides a foundation for building applications.",
  },
  {
    name: "System",
    description:
      "A system is a collection of components that work together to provide a specific functionality.",
  },
  {
    name: "Model",
    description:
      "A model is a representation of a real-world system or process.",
  },
  {
    name: "Application",
    description:
      "An application is a software that provides a specific functionality.",
  },
  {
    name: "Algorithm",
    description: "An algorithm is a set of instructions for solving a problem.",
  },
  {
    name: "Others",
    description: "Anything else that is not covered in the above options.",
  },
];

export const paperSchema = z.object({
  id: z.string().optional(),
  method: z.enum(["Qualitative", "Quantitative", "Mixed"]),
  context: z.string().min(3),
  tangibleOutput: z.discriminatedUnion("type", [
    z.object({ type: z.literal("Framework") }),
    z.object({ type: z.literal("System") }),
    z.object({ type: z.literal("Model") }),
    z.object({ type: z.literal("Algorithm") }),
    z.object({ type: z.literal("Application") }),
    z.object({
      type: z.literal("Others"),
      description: z.string().min(1, "Description is required for 'Others'"),
    }),
  ]),
  title: z.string().min(1),
  authors: z
    .array(
      z.object({
        first_name: z.string().min(1),
        last_name: z.string().min(1),
      })
    )
    .min(1),
  keywords: z.array(z.string().min(1)).min(1),
  affiliations: z
    .array(
      z.object({
        name: z.string().min(1),
        location: z.string().min(1),
        authors: z
          .array(
            z.object({
              first_name: z.string().min(1),
              last_name: z.string().min(1),
            })
          )
          .min(1, { message: "At least one author is required" }),
      })
    )
    .optional(),
  language: z.enum(["en", "id", "ar", "ms"]).optional().default("en"),
});

interface PaperFormProps {
  initialData?: z.infer<typeof paperSchema>;
  isEditing?: boolean;
  paperId?: string | null;
  actionData: NewPaperData | undefined;
  formAction?: string;
  variant?: "default" | "v2";
  wizardMeta?: {
    purpose: string;
    rqCount: number;
    topic: string;
    who: string;
    what: string;
    where: string;
    refinedStatement: string;
  };
}

type PaperFormPropsWithConditionalPaperId =
  | (PaperFormProps & { isEditing: true; paperId: string })
  | (PaperFormProps & { isEditing?: false; paperId?: null });

const EmptyAffiliationsContainer = ({
  handleAddAffiliation,
}: {
  handleAddAffiliation: () => void;
}) => {
  return (
    <Box className={classes.emptyAffiliationsContainer}>
      <Stack gap={2} align="center">
        <Box>
          <Icon name="square-rounded-plus-outline" className={classes.icon} />
        </Box>
        <Title order={3} fw={500}>
          Affiliations
        </Title>
      </Stack>
      <Text c="dimmed" size="md">
        Add affiliations to your paper to help with citation.
      </Text>
      <Button variant="outline" size="md" onClick={handleAddAffiliation}>
        + Add Affiliation
      </Button>
    </Box>
  );
};

interface TangibleOutputRadioGroupProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tangibleOutput: any;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  isEditing?: boolean;
}

interface MethodRadioGroupProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: {
    method: unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  isEditing?: boolean;
}

const TangibleOutputRadioGroup: React.FC<TangibleOutputRadioGroupProps> = ({
  fields,
  form,
  isEditing,
}) => {
  const handleRadioChange = (value: string) => {
    const tangibleOutputType = value as TangibleOutput["type"];
    form.update({
      name: fields.tangibleOutput.name,
      value:
        tangibleOutputType === "Others"
          ? { type: tangibleOutputType, description: "" }
          : { type: tangibleOutputType },
    });
  };

  const cards = tangibleOutputOptions.map((item) => (
    <Radio.Card
      className={toClasses.root}
      radius="md"
      value={item.name}
      key={item.name}
      disabled={isEditing}
      mod={{ disabled: isEditing }}
    >
      <Group wrap="nowrap" align="flex-start">
        <Radio.Indicator
          mod={{ disabled: isEditing }}
          className={toClasses.indicator}
        />
        <div>
          <Text
            size="sm"
            className={toClasses.label}
            mod={{ disabled: isEditing }}
          >
            {item.name}
          </Text>

          {item.name === "Others" &&
          fields.tangibleOutput.value?.type === "Others" ? (
            <TextInput
              readOnly={isEditing}
              size="sm"
              mt={4}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              error={fields.tangibleOutput.getFieldset().description.errors}
              {...getInputProps(
                fields.tangibleOutput.getFieldset().description,
                { type: "text" }
              )}
              onChange={(event) => {
                const newValue = event.currentTarget.value;
                form.update({
                  name: fields.tangibleOutput.name,
                  value: {
                    ...fields.tangibleOutput.value,
                    description: newValue,
                  },
                });
              }}
              onKeyDown={(event) => {
                if (event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  const newValue = event.currentTarget.value + " ";
                  form.update({
                    name: fields.tangibleOutput.name,
                    value: {
                      ...fields.tangibleOutput.value,
                      description: newValue,
                    },
                  });
                }
              }}
              key={fields.tangibleOutput.getFieldset().description.key}
              classNames={{ input: toClasses.tangibleOutputTextInput }}
              mod={{ readonly: isEditing }}
            />
          ) : (
            <Text
              size="sm"
              className={toClasses.description}
              data-disabled={isEditing ? "true" : "false"}
            >
              {item.description}
            </Text>
          )}
        </div>
      </Group>
    </Radio.Card>
  ));

  return (
    <>
      <Radio.Group
        label="Tangible Output"
        description="Choose the tangible output for this proposal"
        value={fields.tangibleOutput.value?.type}
        onChange={handleRadioChange}
        error={fields.tangibleOutput.getFieldset().type.errors}
      >
        <SimpleGrid cols={{ sm: 1, md: 2, lg: 3 }} mt="md">
          {cards}
        </SimpleGrid>
      </Radio.Group>
      <input
        type="hidden"
        name={`${fields.tangibleOutput.name}.type`}
        value={fields.tangibleOutput.value?.type}
      />
    </>
  );
};

const MethodRadioGroup: React.FC<MethodRadioGroupProps> = ({ fields }) => {
  return (
    <Radio.Group
      label="Select the method of your project"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...getInputProps(fields.method as any, { type: "text" })}
      error={(fields.method as { errors?: string[] }).errors}
      withAsterisk
    >
      <Group mt="xs">
        <Radio value="Qualitative" label="Qualitative" />
        <Radio value="Quantitative" label="Quantitative" />
        <Radio value="Mixed" label="Mixed" />
      </Group>
    </Radio.Group>
  );
};

export const PaperForm: React.FC<PaperFormPropsWithConditionalPaperId> = ({
  initialData,
  isEditing = false,
  paperId = null,
  actionData,
  formAction = "/paper/new",
  variant = "default",
  wizardMeta,
}) => {
  const isV2 = variant === "v2";
  const isPending = useIsPending();
  const [aiModalOpened, { open: openAiModal, close: closeAiModal }] =
    useDisclosure(false);

  const [form, fields] = useForm({
    onValidate({ formData }) {
      const res = parseWithZod(formData, { schema: paperSchema });
      return parseWithZod(formData, { schema: paperSchema });
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",

    lastResult: actionData?.lastResult,
    defaultValue: initialData || {
      title: "",
      method: "Qualitative",
      authors: [{ first_name: "", last_name: "" }],
      keywords: [""],
      affiliations: [],
      tangibleOutput: { type: "Framework" },
      language: "en",
    },
  });

  const authors = fields.authors.getFieldList();
  const affiliations = fields.affiliations.getFieldList();

  const [affiliationAuthors, setAffiliationAuthors] = useState<
    Record<number, { first_name: string; last_name: string }[]>
  >(() => {
    if (initialData?.affiliations) {
      return initialData.affiliations.reduce((acc, affiliation, index) => {
        acc[index] = affiliation.authors || [];
        return acc;
      }, {} as Record<number, { first_name: string; last_name: string }[]>);
    }
    return {};
  });

  const handleAddAuthor = () => {
    const currentAuthors = fields.authors.getFieldList();
    form.update({
      name: fields.authors.name,
      index: currentAuthors.length,
      value: {
        first_name: "",
        last_name: "",
      },
    });
  };

  const handleAddAffiliation = () => {
    const currentAffiliations = fields.affiliations.getFieldList();
    form.update({
      name: fields.affiliations.name,
      value: currentAffiliations
        .map((affiliation) => {
          const affiliationFields = affiliation.getFieldset();
          return {
            name: affiliationFields.name.value ?? "",
            location: affiliationFields.location.value ?? "",
            authors: affiliationFields.authors.value ?? [],
          };
        })
        .concat({ name: "", location: "", authors: [] }),
    });
    setAffiliationAuthors((prev) => ({
      ...prev,
      [currentAffiliations.length]: [],
    }));
  };

  const handleReorderAffiliation = (from: number, to: number) => {
    form.reorder({
      name: fields.affiliations.name,
      from,
      to,
    });
    setAffiliationAuthors((prev) => {
      const newAffiliationAuthors = { ...prev };
      const movedAuthors = newAffiliationAuthors[from];

      // Shift all affiliations between 'from' and 'to'
      if (from < to) {
        for (let i = from; i < to; i++) {
          newAffiliationAuthors[i] = newAffiliationAuthors[i + 1] || [];
        }
      } else {
        for (let i = from; i > to; i--) {
          newAffiliationAuthors[i] = newAffiliationAuthors[i - 1] || [];
        }
      }

      newAffiliationAuthors[to] = movedAuthors || [];

      return newAffiliationAuthors;
    });
  };

  const handleRemoveAuthor = (index: number) => {
    form.remove({
      name: fields.authors.name,
      index,
    });

    // Update affiliationAuthors
    setAffiliationAuthors((prev) => {
      const updatedAffiliationAuthors = { ...prev };
      Object.keys(updatedAffiliationAuthors).forEach((affiliationIndex) => {
        updatedAffiliationAuthors[Number(affiliationIndex)] =
          updatedAffiliationAuthors[Number(affiliationIndex)].filter(
            (_, i) => i !== index
          );
      });
      return updatedAffiliationAuthors;
    });
  };

  const handleAuthorNameChange = (
    index: number,
    field: "first_name" | "last_name",
    value: string
  ) => {
    form.update({
      name: `${fields.authors.name}[${index}].${field}`,
      value: value,
    });

    // Update affiliationAuthors
    setAffiliationAuthors((prev) => {
      const updatedAffiliationAuthors = { ...prev };
      Object.keys(updatedAffiliationAuthors).forEach((affiliationIndex) => {
        updatedAffiliationAuthors[Number(affiliationIndex)] =
          updatedAffiliationAuthors[Number(affiliationIndex)].map(
            (author, i) => {
              if (i === index) {
                return { ...author, [field]: value };
              }
              return author;
            }
          );
      });
      return updatedAffiliationAuthors;
    });
  };

  const handleGenerateTitle = (title: string) => {
    form.update({
      name: fields.title.name,
      value: title,
    });
    closeAiModal();
  };

  const handleAffiliationAuthorChange = (
    affiliationIndex: number,
    authorIndex: number,
    isChecked: boolean
  ) => {
    const authorData = {
      first_name: authors[authorIndex].getFieldset().first_name.value || "",
      last_name: authors[authorIndex].getFieldset().last_name.value || "",
    };

    setAffiliationAuthors((prev) => {
      const updatedAuthors = isChecked
        ? [...(prev[affiliationIndex] || []), authorData]
        : (prev[affiliationIndex] || []).filter(
            (_, index) => index !== authorIndex
          );
      return {
        ...prev,
        [affiliationIndex]: updatedAuthors,
      };
    });

    // Update the form state immediately
    form.update({
      name: `${fields.affiliations.name}[${affiliationIndex}].authors`,
      value: isChecked
        ? [...(affiliationAuthors[affiliationIndex] || []), authorData]
        : (affiliationAuthors[affiliationIndex] || []).filter(
            (_, index) => index !== authorIndex
          ),
    });
  };

  return (
    <Stack>
      {!isV2 && (
        <Stack>
          <Text fw={700}>
            {isEditing ? "Edit project" : "Create a new project"}
          </Text>
          {form.errors && (
            <Text c="red" size="sm">
              {form.errors}
            </Text>
          )}
        </Stack>
      )}
      {isV2 && form.errors && (
        <Text c="red" size="xs">
          {form.errors}
        </Text>
      )}
      <AIGenerationModal
        opened={aiModalOpened}
        onClose={closeAiModal}
        onGenerated={handleGenerateTitle}
        action={formAction}
        channelName={`newPaper`}
        eventName="title"
        language={fields.language.value || "en"}
      />
      <Form method="post" action={formAction} {...getFormProps(form)}>
        {wizardMeta && (
          <>
            <input type="hidden" name="purpose" value={wizardMeta.purpose} />
            <input type="hidden" name="rqCount" value={wizardMeta.rqCount} />
            <input type="hidden" name="topic" value={wizardMeta.topic} />
            <input type="hidden" name="who" value={wizardMeta.who} />
            <input type="hidden" name="what" value={wizardMeta.what} />
            <input type="hidden" name="where" value={wizardMeta.where} />
            <input
              type="hidden"
              name="refinedStatement"
              value={wizardMeta.refinedStatement}
            />
          </>
        )}
        <Stack gap="sm">
          <Stack gap="lg">
            <TangibleOutputRadioGroup
              fields={{ tangibleOutput: fields.tangibleOutput }}
              form={form}
              isEditing={isEditing}
            />

            <MethodRadioGroup fields={{ method: fields.method }} form={form} />

            <LanguageSelect field={fields.language} isEditing={isEditing} />

            <TextInput
              label="Title"
              name={fields.title.name}
              defaultValue={fields.title.initialValue}
              error={fields.title.errors}
              size={isV2 ? "xs" : "md"}
              placeholder="Running title"
              inputContainer={(children) => (
                <Grid align="flex-start">
                  <Grid.Col span={{ base: 6, md: 9 }}>{children}</Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Button
                      size="md"
                      variant="light"
                      color="yellow"
                      tabIndex={-1}
                      fullWidth
                      onClick={openAiModal}
                    >
                      ✨ Generate with AI
                    </Button>
                  </Grid.Col>
                </Grid>
              )}
            />

            <TextInput
              label="Context"
              description={
                isV2
                  ? undefined
                  : "What is the context of your paper? Eg: Malaysia, School, Higher Education, etc."
              }
              {...getInputProps(fields.context, { type: "text" })}
              size={isV2 ? "xs" : "md"}
              placeholder="Higher education"
              error={fields.context.errors}
            />

            <TagsInput
              label="Keywords"
              description="Press Enter or use commas to add keywords"
              placeholder="Enter keywords"
              name={fields.keywords.name}
              error={fields.keywords.errors}
              size="md"
              defaultValue={
                isEditing
                  ? normalizeKeywords(fields.keywords.initialValue)
                  : []
              }
              splitChars={[","]}
            />
          </Stack>

          <CDivider />

          <Stack>
            <Stack>
              <Group justify="space-between" align="center">
                <Title order={5} fw={500}>
                  Authors
                </Title>
                <Button
                  size="md"
                  variant="transparent"
                  onClick={handleAddAuthor}
                  type="button"
                  tabIndex={-1}
                >
                  + Add Author
                </Button>
              </Group>
              {authors.map((author, index) => {
                const authorFields = author.getFieldset();

                return (
                  <Group key={author.key} align="flex-start">
                    <Grid style={{ width: "100%" }} align="flex-end" pb={5}>
                      <Grid.Col span="auto">
                        <TextInput
                          label="First Name"
                          size="md"
                          name={authorFields.first_name.name}
                          defaultValue={authorFields.first_name.initialValue}
                          error={authorFields.first_name.errors}
                          onChange={(e) =>
                            handleAuthorNameChange(
                              index,
                              "first_name",
                              e.target.value
                            )
                          }
                          classNames={{
                            root: classes.textInput,
                            error: classes.textInputError,
                            wrapper: classes.textInputWrapper,
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span="auto">
                        <TextInput
                          label="Last Name"
                          size="md"
                          name={authorFields.last_name.name}
                          defaultValue={authorFields.last_name.initialValue}
                          error={authorFields.last_name.errors}
                          onChange={(e) =>
                            handleAuthorNameChange(
                              index,
                              "last_name",
                              e.target.value
                            )
                          }
                          classNames={{
                            root: classes.textInput,
                            error: classes.textInputError,
                            wrapper: classes.textInputWrapper,
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span="content">
                        <Button
                          type="button"
                          size="md"
                          variant="light"
                          color="red"
                          tabIndex={-1}
                          onClick={() => handleRemoveAuthor(index)}
                          disabled={authors.length === 1}
                        >
                          Remove
                        </Button>
                      </Grid.Col>
                    </Grid>
                  </Group>
                );
              })}
            </Stack>
            {isEditing && paperId && (
              <input type="hidden" name="id" value={initialData?.id} />
            )}
          </Stack>

          <CDivider />

          <Stack>
            {affiliations.length > 0 ? (
              <Stack>
                <Group justify="space-between" align="center">
                  <Title order={5} fw={500}>
                    Affiliations
                  </Title>
                  <Button
                    size="md"
                    variant="transparent"
                    onClick={handleAddAffiliation}
                    type="button"
                    tabIndex={-1}
                  >
                    + Add Affiliation
                  </Button>
                </Group>

                {affiliations.map((affiliation, affiliationIndex) => {
                  const affiliationFields = affiliation.getFieldset();

                  return (
                    <Box key={affiliation.key} className={classes.affiliation}>
                      {affiliationIndex === 0 ? (
                        <Badge color="orange">Main Affiliation</Badge>
                      ) : (
                        <Badge color="gray">
                          Affiliation {affiliationIndex + 1}
                        </Badge>
                      )}
                      <Grid align="flex-end">
                        <Grid.Col span="auto">
                          <TextInput
                            size="md"
                            label="Name"
                            placeholder="e.g. Universiti Putra Malaysia (UPM)"
                            name={affiliationFields.name.name}
                            defaultValue={affiliationFields.name.initialValue}
                            error={affiliationFields.name.errors}
                            classNames={{
                              root: classes.textInput,
                              error: classes.textInputError,
                              wrapper: classes.textInputWrapper,
                            }}
                          />
                        </Grid.Col>
                        <Grid.Col span="auto">
                          <TextInput
                            size="md"
                            label="Location"
                            placeholder="e.g. Serdang, Selangor"
                            name={affiliationFields.location.name}
                            defaultValue={
                              affiliationFields.location.initialValue
                            }
                            error={affiliationFields.location.errors}
                            classNames={{
                              root: classes.textInput,
                              error: classes.textInputError,
                              wrapper: classes.textInputWrapper,
                            }}
                          />
                        </Grid.Col>
                      </Grid>
                      <Box className={classes.affiliatedAuthors}>
                        {authors.length > 0 ? (
                          <Text size="sm" fw={500} mb="xs">
                            Linked authors:
                          </Text>
                        ) : null}
                        {affiliationFields.authors.errors ? (
                          <Text size="sm" mb="xs" c="red.8">
                            {affiliationFields.authors.errors}
                          </Text>
                        ) : null}
                        <Group>
                          {authors.map((author, authorIndex) => {
                            const authorFields = author.getFieldset();
                            const firstName = authorFields.first_name.value;
                            const lastName = authorFields.last_name.value;

                            if (firstName && lastName) {
                              const authorName = `${firstName} ${lastName}`;
                              const isChecked =
                                affiliationAuthors[affiliationIndex]?.some(
                                  (a) =>
                                    a.first_name === firstName &&
                                    a.last_name === lastName
                                ) || false;
                              const authorError =
                                affiliationFields.authors.errors;

                              return (
                                <Checkbox
                                  size="md"
                                  key={authorIndex}
                                  error={authorError ? true : false}
                                  checked={isChecked}
                                  onChange={(event) => {
                                    handleAffiliationAuthorChange(
                                      affiliationIndex,
                                      authorIndex,
                                      event.currentTarget.checked
                                    );
                                  }}
                                  label={authorName}
                                />
                              );
                            }
                            return null;
                          })}
                        </Group>
                        {affiliationAuthors[affiliationIndex]?.map(
                          (author, index) => (
                            <React.Fragment key={index}>
                              <input
                                type="hidden"
                                name={`${affiliationFields.authors.name}[${index}].first_name`}
                                value={author.first_name}
                              />
                              <input
                                type="hidden"
                                name={`${affiliationFields.authors.name}[${index}].last_name`}
                                value={author.last_name}
                              />
                            </React.Fragment>
                          )
                        )}
                      </Box>
                      <Group justify="space-between">
                        <Group gap="xs">
                          <Button
                            size="md"
                            {...form.reorder.getButtonProps({
                              name: fields.affiliations.name,
                              from: affiliationIndex,
                              to: affiliationIndex - 1,
                            })}
                            variant="default"
                            leftSection={
                              <Icon
                                name="chevron-up-outline"
                                className={classes.upIcon}
                              />
                            }
                            disabled={affiliationIndex === 0}
                            type="submit"
                            onClick={() =>
                              handleReorderAffiliation(
                                affiliationIndex,
                                affiliationIndex - 1
                              )
                            }
                          >
                            Move up
                          </Button>
                          <Button
                            size="md"
                            {...form.reorder.getButtonProps({
                              name: fields.affiliations.name,
                              from: affiliationIndex,
                              to: affiliationIndex + 1,
                            })}
                            variant="default"
                            leftSection={
                              <Icon
                                name="chevron-down-outline"
                                className={classes.upIcon}
                              />
                            }
                            disabled={
                              affiliationIndex === affiliations.length - 1
                            }
                            type="submit"
                            onClick={() =>
                              handleReorderAffiliation(
                                affiliationIndex,
                                affiliationIndex + 1
                              )
                            }
                          >
                            Move down
                          </Button>
                        </Group>

                        <Button
                          type="submit"
                          size="md"
                          variant="light"
                          color="red"
                          tabIndex={-1}
                          {...form.remove.getButtonProps({
                            name: fields.affiliations.name,
                            index: affiliationIndex,
                          })}
                        >
                          Remove
                        </Button>
                      </Group>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyAffiliationsContainer
                handleAddAffiliation={handleAddAffiliation}
              />
            )}
          </Stack>

          <Box className={classes.buttonContainer}>
            <Button type="submit" disabled={isPending} size={isV2 ? "xs" : "md"}>
              {isV2 ? "Continue" : isEditing ? "Update" : "Create"}
            </Button>
          </Box>
        </Stack>
      </Form>
    </Stack>
  );
};

export default PaperForm;
