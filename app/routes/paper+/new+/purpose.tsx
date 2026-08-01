import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import { requireAuth } from "#app/services/authentication.server";
import { Button, Group } from "@mantine/core";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { PurposeCard, WizardShell } from "#app/components/v2/V2UIKit";
import classes from "#app/components/v2/v2.module.css";
import { WIZARD_STEPS } from "#app/utils/new-project-wizard";

const PURPOSES = [
  {
    id: "paper",
    title: "Research paper",
    desc: "1 RQ · Standard depth",
    badge: "1 RQ",
    rqCount: 1,
  },
  {
    id: "masters",
    title: "Master's / PhD",
    desc: "2–3 RQs · Full rigour",
    badge: "2–3 RQs",
    rqCount: 2,
  },
  {
    id: "project",
    title: "Research project",
    desc: "1 RQ · 8–12 months",
    badge: "1 RQ",
    rqCount: 1,
  },
] as const;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth({ request });
  if (!isPaperV2FlowEnabled()) {
    throw redirect("/paper/new/legacy");
  }
  return json({ purposes: PURPOSES });
};

export default function NewProjectPurpose() {
  const { purposes } = useLoaderData<typeof loader>();

  return (
    <WizardShell steps={[...WIZARD_STEPS]} currentStep={0}>
      <div className={classes.wizardContent}>
        <div className={classes.wizardTitle}>
          What is the purpose of this research?
        </div>
        <div className={classes.wizardSub}>
          This sets rigour profile, RQ count, and engine route for the whole
          project.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {purposes.map((p) => (
            <PurposeCard
              key={p.id}
              title={p.title}
              description={p.desc}
              badge={p.badge}
              to={`/paper/new/topic?purpose=${p.id}&rqCount=${p.rqCount}`}
            />
          ))}
        </div>

        <div className={classes.wizardActions}>
          <Button component={Link} to="/home/projects" variant="outline" size="xs">
            Cancel
          </Button>
        </div>
      </div>
    </WizardShell>
  );
}
