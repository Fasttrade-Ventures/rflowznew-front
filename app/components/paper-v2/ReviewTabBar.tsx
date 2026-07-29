import { Group } from "@mantine/core";
import classes from "./paper-v2.module.css";
import type { ReviewProposalTab } from "./types";

const TAB_LABELS: Record<ReviewProposalTab, string> = {
  preview: "Preview",
  apa_references: "APA References",
  integrity: "Integrity",
  diagrams: "Diagrams",
};

type ReviewTabBarProps = {
  activeTab: ReviewProposalTab;
  onTabChange?: (tab: ReviewProposalTab) => void;
};

export function ReviewTabBar({ activeTab, onTabChange }: ReviewTabBarProps) {
  return (
    <Group
      gap={0}
      wrap="nowrap"
      style={{
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
    >
      {(Object.keys(TAB_LABELS) as ReviewProposalTab[]).map((tab) => {
        const isActive = tab === activeTab;

        return (
          <button
            key={tab}
            type="button"
            className={[classes.reviewTab, isActive ? classes.reviewTabActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onTabChange?.(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        );
      })}
    </Group>
  );
}
