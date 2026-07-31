import { AppHeaderV2 } from "#app/components/v2/AppHeaderV2";
import { Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useMemo, type ReactNode } from "react";

import { PaperSidebar } from "./PaperSidebar";
import classes from "./paper-v2.module.css";
import type { PaperWorkspaceLayoutProps } from "./types";
import { computePaperOverallProgress } from "#app/utils/paper-v2-progress";

type PaperWorkspaceLayoutComponentProps = PaperWorkspaceLayoutProps & {
  paperKeywords?: string[];
  children: ReactNode;
};

export function PaperWorkspaceLayout({
  paperId,
  paperTitle,
  progress,
  overallPercentage,
  simulationV2,
  children,
}: PaperWorkspaceLayoutComponentProps) {
  const [opened, { toggle, close }] = useDisclosure();

  useEffect(() => {
    close();
  }, [paperId, close]);

  const resolvedOverallProgress = useMemo(
    () =>
      computePaperOverallProgress(progress, {
        overallPercentage,
        simulationV2,
      }),
    [overallPercentage, progress, simulationV2]
  );

  return (
    <div className={`rz-v2 ${classes.workspace}`}>
      <div
        className={classes.sidebarWrap}
        data-open={opened || undefined}
      >
        <PaperSidebar
          paperId={paperId}
          paperTitle={paperTitle}
          progress={progress}
          overallProgress={resolvedOverallProgress}
        />
      </div>

      <div className={classes.main}>
        <div className={classes.mainHeader}>
          <Group justify="space-between" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="lg"
              size="sm"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <AppHeaderV2 />
            </div>
          </Group>
        </div>

        <div className={classes.mainContent}>{children}</div>
      </div>
    </div>
  );
}
