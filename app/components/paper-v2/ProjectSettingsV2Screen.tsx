import { paperSchema } from "#app/components/ui/paper/PaperForm";
import type { action as settingsEditAction } from "#app/routes/paper+/$paperId+/settings+/edit";
import type { loader as rootLoader } from "#app/root";
import { purposeLabel } from "#app/utils/new-project-wizard";
import { useIsPending } from "#app/utils/misc";
import { PageBreadcrumb, PageTitleBlock } from "#app/components/v2/V2UIKit";
import { getFormProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import {
  Button,
  Checkbox,
  Group,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from "@mantine/core";
import { Form, Link, useRouteLoaderData } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/node";
import React, { useState } from "react";
import { z } from "zod";

import v2Classes from "#app/components/v2/v2.module.css";
import { normalizeKeywords } from "#app/utils/normalize-keywords";
import classes from "./project-settings-v2.module.css";
import formClasses from "./paper-v2-form.module.css";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ms: "Malay",
  ar: "Arabic",
  id: "Indonesian",
};

type PaperMeta = {
  purpose?: string;
  rqCount?: number;
};

type ProjectSettingsV2ScreenProps = {
  initialData: z.infer<typeof paperSchema>;
  paperId: string;
  paperTitle: string;
  paperMeta?: PaperMeta | null;
  actionData: SerializeFrom<typeof settingsEditAction> | undefined;
};

function tangibleOutputLabel(
  tangibleOutput: z.infer<typeof paperSchema>["tangibleOutput"]
): string {
  if (tangibleOutput.type === "Others") {
    return tangibleOutput.description?.trim() || "Others";
  }
  return tangibleOutput.type;
}

export function ProjectSettingsV2Screen({
  initialData,
  paperId,
  paperTitle,
  paperMeta,
  actionData,
}: ProjectSettingsV2ScreenProps) {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const contactEmail = rootData?.user?.email ?? "";
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: "project-settings-form",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: paperSchema });
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    lastResult: actionData?.lastResult,
    defaultValue: initialData,
  });

  const authors = fields.authors.getFieldList();
  const affiliations = fields.affiliations.getFieldList();
  const tangibleType = initialData.tangibleOutput.type;
  const tangibleDescription =
    initialData.tangibleOutput.type === "Others"
      ? initialData.tangibleOutput.description ?? ""
      : "";

  const [affiliationAuthors, setAffiliationAuthors] = useState<
    Record<number, { first_name: string; last_name: string }[]>
  >(() => {
    if (initialData.affiliations) {
      return initialData.affiliations.reduce(
        (acc, affiliation, index) => {
          acc[index] = affiliation.authors || [];
          return acc;
        },
        {} as Record<number, { first_name: string; last_name: string }[]>
      );
    }
    return {};
  });

  const handleAddAuthor = () => {
    form.insert({
      name: fields.authors.name,
      defaultValue: { first_name: "", last_name: "" },
    });
  };

  const handleRemoveAuthor = (index: number) => {
    form.remove({ name: fields.authors.name, index });
    setAffiliationAuthors((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((affiliationIndex) => {
        updated[Number(affiliationIndex)] = updated[
          Number(affiliationIndex)
        ].filter((_, i) => i !== index);
      });
      return updated;
    });
  };

  const handleAuthorNameChange = (
    index: number,
    field: "first_name" | "last_name",
    value: string
  ) => {
    form.update({
      name: `${fields.authors.name}[${index}].${field}`,
      value,
    });

    setAffiliationAuthors((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((affiliationIndex) => {
        updated[Number(affiliationIndex)] = updated[
          Number(affiliationIndex)
        ].map((author, i) => (i === index ? { ...author, [field]: value } : author));
      });
      return updated;
    });
  };

  const handleAddAffiliation = () => {
    const nextIndex = fields.affiliations.getFieldList().length;
    form.insert({
      name: fields.affiliations.name,
      defaultValue: { name: "", location: "", authors: [] },
    });
    setAffiliationAuthors((prev) => ({
      ...prev,
      [nextIndex]: [],
    }));
  };

  const handleRemoveAffiliation = (index: number) => {
    form.remove({ name: fields.affiliations.name, index });
    setAffiliationAuthors((prev) => {
      const next: Record<number, { first_name: string; last_name: string }[]> =
        {};
      Object.entries(prev).forEach(([key, value]) => {
        const i = Number(key);
        if (i < index) next[i] = value;
        else if (i > index) next[i - 1] = value;
      });
      return next;
    });
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
        : (prev[affiliationIndex] || []).filter((_, index) => index !== authorIndex);

      form.update({
        name: `${fields.affiliations.name}[${affiliationIndex}].authors`,
        value: updatedAuthors,
      });

      return { ...prev, [affiliationIndex]: updatedAuthors };
    });
  };

  const keywordValues = normalizeKeywords(
    fields.keywords.initialValue ?? initialData.keywords
  );

  const profileBadges = [
    paperMeta?.purpose
      ? `${purposeLabel(paperMeta.purpose)} · ${paperMeta.rqCount ?? 1} RQ`
      : null,
    tangibleOutputLabel(initialData.tangibleOutput),
    initialData.method,
    LANGUAGE_LABELS[initialData.language ?? "en"] ?? initialData.language,
  ].filter(Boolean);

  return (
    <div className={classes.shell}>
      <PageBreadcrumb>{paperTitle} → Project settings</PageBreadcrumb>

      <PageTitleBlock
        title="Project settings"
        subtitle="Update citation metadata used on your exported proposal title page."
        actions={
          <Button
            type="submit"
            form="project-settings-form"
            size="sm"
            className={classes.headerSave}
            disabled={isPending}
          >
            Save changes
          </Button>
        }
      />

      {actionData?.serverError ? (
        <Text c="red" size="xs">
          {actionData.serverError}
        </Text>
      ) : null}

      {form.errors ? (
        <Text c="red" size="xs">
          {form.errors}
        </Text>
      ) : null}

      <div className={classes.profileStrip}>
        <div className={classes.profileHeading}>Project profile (read-only)</div>
        <div className={classes.profileBadges}>
          {profileBadges.map((badge) => (
            <span key={badge} className={classes.profileBadge}>
              {badge}
            </span>
          ))}
        </div>
        <p className={classes.profileNote}>
          Purpose, output type, method, and language are set when the project is
          created. This page is for title-page details: authors, affiliations,
          and keywords.
        </p>
      </div>

      <Form
        method="post"
        {...getFormProps(form)}
        className={`${v2Classes.paperFormV2} ${classes.form}`}
      >
        <input type="hidden" name="id" value={initialData.id} />
        <input type="hidden" name={fields.method.name} value={initialData.method} />
        <input type="hidden" name={fields.language.name} value={initialData.language ?? "en"} />
        <input
          type="hidden"
          name={`${fields.tangibleOutput.name}.type`}
          value={tangibleType}
        />
        {tangibleType === "Others" ? (
          <input
            type="hidden"
            name={fields.tangibleOutput.getFieldset().description.name}
            value={tangibleDescription}
          />
        ) : null}

        <div className={classes.grid}>
          <section className={`${classes.panel} ${classes.citationPanel}`}>
            <div>
              <div className={classes.panelTitle}>Citation metadata</div>
              <div className={classes.panelSub}>
                Shown on your DOCX/PDF title page and export headers.
              </div>
            </div>

            <div className={classes.field}>
              <label className={classes.fieldLabel} htmlFor={fields.title.id}>
                Title
              </label>
              <TextInput
                size="xs"
                id={fields.title.id}
                name={fields.title.name}
                key={fields.title.key}
                defaultValue={fields.title.initialValue}
                error={fields.title.errors}
                placeholder="Running title"
              />
            </div>

            <div className={classes.field}>
              <div className={classes.fieldLabel}>Contact (corresponding author)</div>
              <div className={classes.contactValue}>{contactEmail}</div>
              <div className={classes.fieldHint}>
                Uses your account email for export correspondence.
              </div>
            </div>

            <div className={classes.field}>
              <label className={classes.fieldLabel} htmlFor={fields.context.id}>
                Context
              </label>
              <TextInput
                size="xs"
                id={fields.context.id}
                name={fields.context.name}
                key={fields.context.key}
                defaultValue={fields.context.initialValue}
                placeholder="Public universities in Malaysia"
                error={fields.context.errors}
              />
            </div>

            <div className={classes.field}>
              <TagsInput
                label="Keywords"
                description="Press Enter or use commas to add keywords"
                placeholder="Enter keywords"
                name={fields.keywords.name}
                key={fields.keywords.key}
                defaultValue={keywordValues}
                error={fields.keywords.errors}
                size="xs"
                splitChars={[","]}
                classNames={{ input: v2Classes.setupTagsInput }}
              />
            </div>
          </section>

          <section className={`${classes.panel} ${classes.authorsPanel}`}>
            <div>
              <div className={classes.panelTitle}>Authors & affiliations</div>
              <div className={classes.panelSub}>
                Link each author to one or more institutions for the title page.
              </div>
            </div>

            <div className={classes.field}>
              <div className={classes.sectionHeader}>
                <div className={classes.fieldLabel}>Authors</div>
                <button
                  type="button"
                  className={classes.linkButton}
                  onClick={handleAddAuthor}
                >
                  + Add author
                </button>
              </div>

              <Stack gap={8}>
                {authors.map((author, index) => {
                  const authorFields = author.getFieldset();
                  return (
                    <div key={author.key} className={classes.authorRow}>
                      <TextInput
                        size="xs"
                        label="First name"
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
                      />
                      <TextInput
                        size="xs"
                        label="Last name"
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
                      />
                      <button
                        type="button"
                        className={classes.linkButtonDanger}
                        onClick={() => handleRemoveAuthor(index)}
                        disabled={authors.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </Stack>
            </div>

            <div className={classes.field}>
              <div className={classes.sectionHeader}>
                <div className={classes.fieldLabel}>Affiliations</div>
                <button
                  type="button"
                  className={classes.linkButton}
                  onClick={handleAddAffiliation}
                >
                  + Add affiliation
                </button>
              </div>

              {affiliations.length === 0 ? (
                <div className={classes.emptyAffiliations}>
                  <span>No affiliations yet.</span>
                  <button
                    type="button"
                    className={classes.linkButton}
                    onClick={handleAddAffiliation}
                  >
                    Add your first affiliation
                  </button>
                </div>
              ) : (
                <Stack gap={8}>
                  {affiliations.map((affiliation, affiliationIndex) => {
                    const affiliationFields = affiliation.getFieldset();
                    return (
                      <div key={affiliation.key} className={classes.affCard}>
                        <TextInput
                          size="xs"
                          label="Institution"
                          placeholder="Universiti Putra Malaysia (UPM)"
                          name={affiliationFields.name.name}
                          defaultValue={affiliationFields.name.initialValue}
                          error={affiliationFields.name.errors}
                        />
                        <TextInput
                          size="xs"
                          label="Location"
                          placeholder="Serdang, Selangor"
                          name={affiliationFields.location.name}
                          defaultValue={affiliationFields.location.initialValue}
                          error={affiliationFields.location.errors}
                        />

                        {authors.length > 0 ? (
                          <Group gap="xs">
                            {authors.map((author, authorIndex) => {
                              const authorFields = author.getFieldset();
                              const firstName = authorFields.first_name.value;
                              const lastName = authorFields.last_name.value;
                              if (!firstName || !lastName) return null;

                              const authorName = `${firstName} ${lastName}`;
                              const isChecked =
                                affiliationAuthors[affiliationIndex]?.some(
                                  (a) =>
                                    a.first_name === firstName &&
                                    a.last_name === lastName
                                ) || false;

                              return (
                                <Checkbox
                                  key={authorIndex}
                                  size="xs"
                                  checked={isChecked}
                                  onChange={(event) =>
                                    handleAffiliationAuthorChange(
                                      affiliationIndex,
                                      authorIndex,
                                      event.currentTarget.checked
                                    )
                                  }
                                  label={authorName}
                                />
                              );
                            })}
                          </Group>
                        ) : null}

                        {affiliationFields.authors.errors ? (
                          <Text size="xs" c="red">
                            {affiliationFields.authors.errors}
                          </Text>
                        ) : null}

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

                        <button
                          type="button"
                          className={classes.linkButtonDanger}
                          onClick={() =>
                            handleRemoveAffiliation(affiliationIndex)
                          }
                        >
                          Remove affiliation
                        </button>
                      </div>
                    );
                  })}
                </Stack>
              )}
            </div>
          </section>
        </div>

        <div className={`${classes.actions} ${formClasses.formActions}`}>
          <Button
            component={Link}
            to={`/paper/${paperId}/library`}
            variant="outline"
            size="sm"
          >
            Back to workspace
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            Save changes
          </Button>
        </div>
      </Form>
    </div>
  );
}
