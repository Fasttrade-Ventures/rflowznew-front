import { V2Card, WizardShell } from "#app/components/v2/V2UIKit";
import { createNewPaper } from "#app/services/paper.server";
import { requireAuth } from "#app/services/authentication.server";
import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import {
  buildPaperPayloadFromDraft,
  engineRouteLabel,
  purposeLabel,
  WIZARD_STEPS,
} from "#app/utils/new-project-wizard";
import {
  clearWizardDraftCookie,
  readWizardDraftCookie,
} from "#app/utils/new-project-wizard.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { Button } from "@mantine/core";
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import classes from "#app/components/v2/v2.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth({ request });
  if (!isPaperV2FlowEnabled()) {
    throw redirect("/paper/new/legacy");
  }

  const draft = await readWizardDraftCookie(request);
  if (!draft?.refinedStatement || !draft.topic) {
    throw redirect("/paper/new/purpose");
  }

  return json({ draft });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireAuth({ request });
  if (!isPaperV2FlowEnabled()) {
    throw redirect("/paper/new/legacy");
  }

  const draft = await readWizardDraftCookie(request);
  if (!draft?.refinedStatement || !draft.topic) {
    throw redirect("/paper/new/purpose");
  }

  const res = await createNewPaper({
    paper: buildPaperPayloadFromDraft(draft, user.name),
    request,
  });

  return redirectWithToast(
    `/paper/${res.data?.paper.id}/library`,
    {
      type: "success",
      title: "Project created",
      description: "Start by building your source library.",
    },
    {
      headers: {
        "Set-Cookie": await clearWizardDraftCookie(),
      },
    }
  );
};

export default function NewProjectReview() {
  const { draft } = useLoaderData<typeof loader>();

  const rows = [
    ["Purpose", `${purposeLabel(draft.purpose)} · ${draft.rqCount} RQ(s)`],
    [
      "Engine route",
      engineRouteLabel(draft.purpose, draft.rqCount),
    ],
    ["Research topic", draft.topic],
    ["Population", draft.who],
    ["Phenomenon", draft.what],
    ["Setting", draft.where],
    ["Refined statement", draft.refinedStatement],
    ["Next step", "Library — dual retrieval"],
  ] as const;

  return (
    <WizardShell steps={[...WIZARD_STEPS]} currentStep={2}>
      <div className={classes.wizardContent}>
        <div className={classes.wizardTitle}>Review and create project</div>
        <div className={classes.wizardSub}>
          Confirm your purpose and scope before entering the paper workspace.
        </div>
        <V2Card title="Project summary">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {rows.map(([key, value]) => (
              <div key={key} className={classes.wizardReviewRow}>
                <span className={classes.wizardReviewKey}>{key}</span>
                <span className={classes.wizardReviewVal}>{value}</span>
              </div>
            ))}
          </div>
        </V2Card>

        <form method="post">
          <div className={classes.wizardActions}>
            <Button
              component={Link}
              to={`/paper/new/topic?purpose=${draft.purpose}&rqCount=${draft.rqCount}`}
              variant="outline"
              size="xs"
            >
              Back
            </Button>
            <Button type="submit" size="xs">
              Create project
            </Button>
          </div>
        </form>
      </div>
    </WizardShell>
  );
}
