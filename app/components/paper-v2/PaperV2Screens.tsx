import {
  GuideBanner,
  PaperPanel,
  PaperScreenHeader,
  ProfZBanner,
} from "#app/components/v2/PaperScreen";
import { Button, Stack } from "@mantine/core";
import { Link } from "@remix-run/react";
import type { ReactNode } from "react";

export { PaperPanel, PaperScreenHeader, GuideBanner, ProfZBanner };

export function PhilosophyV2Shell() {
  return (
    <Stack gap="sm">
      <PaperScreenHeader
        title="Philosophy"
        subtitle="Ontology, epistemology, and axiology"
      />
      <GuideBanner>
        Socratic steps help you articulate your research worldview before
        methodology. Backend API ships in Phase 4.
      </GuideBanner>
      <ProfZBanner message="Start with ontology: what exists in your study world? Then epistemology: how will you know it? Finally axiology: what values guide your inquiry?" />
      <PaperPanel title="Research philosophy" subtitle="Phase 4 — coming soon">
        <Stack gap="xs">
          <Button component={Link} to="../methodology" size="xs" variant="light">
            Continue to Methodology
          </Button>
        </Stack>
      </PaperPanel>
    </Stack>
  );
}

export function FrameworksV2Shell() {
  return (
    <Stack gap="sm">
      <PaperScreenHeader
        title="Frameworks"
        subtitle="Theoretical framework and diagram"
      />
      <GuideBanner>
        Build your conceptual framework and preview Mermaid diagrams here.
        Export embeds the diagram in Review Proposal.
      </GuideBanner>
      <ProfZBanner message="Map constructs from your literature and methodology into a visual framework before assembling the proposal." />
      <PaperPanel title="Framework builder" subtitle="Phase 6 — coming soon">
        <Stack gap="xs">
          <Button
            component={Link}
            to="../review-proposal"
            size="xs"
            variant="light"
          >
            Open Review Proposal
          </Button>
        </Stack>
      </PaperPanel>
    </Stack>
  );
}

export function PaperV2Page({
  title,
  subtitle,
  guide,
  profZ,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  guide?: string;
  profZ?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Stack gap="sm">
      <PaperScreenHeader title={title} subtitle={subtitle} actions={actions} />
      {guide && <GuideBanner>{guide}</GuideBanner>}
      {profZ && <ProfZBanner message={profZ} />}
      {children}
    </Stack>
  );
}
