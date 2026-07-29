import { Button, Text } from "@mantine/core";
import { Form, Link } from "@remix-run/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { WizardShell } from "#app/components/v2/V2UIKit";
import classes from "#app/components/v2/v2.module.css";
import {
  buildRefinedStatement,
  readWizardDraft,
  topicSchema,
  WIZARD_STEPS,
  type TopicDraft,
} from "#app/utils/new-project-wizard";

type FieldErrors = Partial<Record<keyof TopicDraft, string>>;

export function NewProjectTopicForm({
  initial,
  actionData,
}: {
  initial: TopicDraft;
  actionData?: { fieldErrors?: Partial<Record<keyof TopicDraft, string>> };
}) {
  const [values, setValues] = useState<TopicDraft>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const saved = readWizardDraft();
    if (!saved) return;
    setValues((prev) => ({
      ...prev,
      purpose: initial.purpose,
      rqCount: initial.rqCount,
      topic: saved.topic || prev.topic,
      who: saved.who || prev.who,
      what: saved.what || prev.what,
      where: saved.where || prev.where,
    }));
  }, [initial.purpose, initial.rqCount]);

  useEffect(() => {
    if (!actionData?.fieldErrors) return;
    setErrors(actionData.fieldErrors);
  }, [actionData]);

  const refinedStatement = useMemo(
    () => buildRefinedStatement(values),
    [values]
  );

  const setField = <K extends keyof TopicDraft>(key: K, value: TopicDraft[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    const parsed = topicSchema.safeParse(values);
    if (!parsed.success) {
      event.preventDefault();
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof TopicDraft;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
    }
  };

  return (
    <WizardShell steps={[...WIZARD_STEPS]} currentStep={1}>
      <Form method="post" onSubmit={handleContinue}>
        <input type="hidden" name="purpose" value={values.purpose} />
        <input type="hidden" name="rqCount" value={values.rqCount} />

        <div className={classes.wizardContent}>
          <div className={classes.wizardTitle}>Topic and scope</div>
          <div className={classes.wizardSub}>
            What do you want to research? Prof Zack will help narrow population,
            phenomenon, and setting.
          </div>

          <div className={classes.wizardFieldRow}>
            <label className={classes.wizardFieldLabel} htmlFor="topic">
              Research topic
            </label>
            <input
              id="topic"
              name="topic"
              className={classes.wizardInput}
              placeholder="Residents' experience of community in high-rise PPR..."
              value={values.topic}
              onChange={(e) => setField("topic", e.currentTarget.value)}
            />
            {errors.topic && (
              <Text size="xs" c="red">
                {errors.topic}
              </Text>
            )}
          </div>

          <div className={classes.wizardFieldRow}>
            <label className={classes.wizardFieldLabel} htmlFor="who">
              Who exactly?
            </label>
            <input
              id="who"
              name="who"
              className={classes.wizardInput}
              placeholder="PPR residents"
              value={values.who}
              onChange={(e) => setField("who", e.currentTarget.value)}
            />
            {errors.who && (
              <Text size="xs" c="red">
                {errors.who}
              </Text>
            )}
          </div>

          <div className={classes.wizardFieldRow}>
            <label className={classes.wizardFieldLabel} htmlFor="what">
              What matters?
            </label>
            <input
              id="what"
              name="what"
              className={classes.wizardInput}
              placeholder="Use of communal space"
              value={values.what}
              onChange={(e) => setField("what", e.currentTarget.value)}
            />
            {errors.what && (
              <Text size="xs" c="red">
                {errors.what}
              </Text>
            )}
          </div>

          <div className={classes.wizardFieldRow}>
            <label className={classes.wizardFieldLabel} htmlFor="where">
              Where?
            </label>
            <input
              id="where"
              name="where"
              className={classes.wizardInput}
              placeholder="Klang Valley high-rise"
              value={values.where}
              onChange={(e) => setField("where", e.currentTarget.value)}
            />
            {errors.where && (
              <Text size="xs" c="red">
                {errors.where}
              </Text>
            )}
          </div>

          {values.purpose === "masters" ? (
            <div className={classes.wizardFieldRow}>
              <label className={classes.wizardFieldLabel}>Research questions</label>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  type="button"
                  size="xs"
                  variant={values.rqCount === 2 ? "filled" : "outline"}
                  onClick={() => setField("rqCount", 2)}
                >
                  Master's · 2 RQs
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={values.rqCount === 3 ? "filled" : "outline"}
                  onClick={() => setField("rqCount", 3)}
                >
                  PhD · 3 RQs
                </Button>
              </div>
            </div>
          ) : null}

          <div className={classes.wizardStatement}>
            <div className={classes.wizardStatementLabel}>Refined statement</div>
            <div className={classes.wizardStatementText}>{refinedStatement}</div>
          </div>

          <div className={classes.wizardActions}>
            <Button
              component={Link}
              to={`/paper/new/purpose`}
              variant="outline"
              size="xs"
            >
              Back
            </Button>
            <Button type="submit" size="xs">
              Continue
            </Button>
          </div>
        </div>
      </Form>
    </WizardShell>
  );
}
