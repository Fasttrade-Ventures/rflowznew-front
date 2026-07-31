import { Icon } from "#app/components/icon";
import { Link, NavLink as RemixNavLink } from "@remix-run/react";
import { Badge, Button, Stack, Text } from "@mantine/core";

import { buildPaperNavHref, PAPER_NAV_PHASES } from "./nav-config";
import classes from "./paper-v2.module.css";
import type { PaperWorkspaceLayoutProps } from "./types";

type PaperSidebarProps = Pick<
  PaperWorkspaceLayoutProps,
  "paperId" | "progress" | "userName" | "userEmail"
> & {
  paperTitle?: string;
  overallProgress?: number;
};

export function PaperSidebar({
  paperId,
  paperTitle,
  progress,
  overallProgress = 0,
}: PaperSidebarProps) {
  return (
    <aside className={classes.sidebar}>
      <div className={classes.sidebarHeader}>
        <Button
          variant="subtle"
          size="compact-xs"
          color="gray"
          component={Link}
          to="/"
          leftSection={
            <Icon
              name="arrow-narrow-left-outline"
              style={{ width: 14, height: 14 }}
            />
          }
          styles={{ root: { paddingLeft: 0 } }}
        >
          Home
        </Button>
        {paperTitle && (
          <Text size="xs" fw={600} lineClamp={2} mt={4}>
            {paperTitle}
          </Text>
        )}
      </div>

      <div className={classes.sidebarContent}>
        {PAPER_NAV_PHASES.map((group) => (
          <div key={group.phase}>
            <Text className={classes.phaseLabel}>{group.phase}</Text>
            <Stack gap={2}>
              {group.items.map((item) => {
                const href = buildPaperNavHref(paperId, item.path);
                const completion = item.progressKey
                  ? progress[item.progressKey]?.completion_percentage
                  : undefined;

                return (
                  <RemixNavLink
                    key={item.path}
                    to={href}
                    style={{ textDecoration: "none" }}
                  >
                    {({ isActive }) => (
                      <span
                        className={classes.navLink}
                        data-active={isActive || undefined}
                      >
                        <Icon name={item.icon} className={classes.navIcon} />
                        <span>{item.label}</span>
                        {item.comingSoon && (
                          <Badge
                            size="xs"
                            variant="light"
                            color="gray"
                            className={classes.comingSoonBadge}
                          >
                            Soon
                          </Badge>
                        )}
                        {!item.comingSoon &&
                          completion !== undefined &&
                          completion === 100 && (
                            <Icon
                              name="check-outline"
                              className={classes.comingSoonBadge}
                              style={{ width: 14, height: 14 }}
                            />
                          )}
                      </span>
                    )}
                  </RemixNavLink>
                );
              })}
            </Stack>
          </div>
        ))}
      </div>

      <div className={classes.sidebarFooter}>
        <RemixNavLink
          to={`/paper/${paperId}/settings`}
          style={{ textDecoration: "none" }}
        >
          {({ isActive }) => (
            <span className={classes.navLink} data-active={isActive || undefined}>
              <Icon name="settings-outline" className={classes.navIcon} />
              <span>Project settings</span>
            </span>
          )}
        </RemixNavLink>
        <Text size="xs" c="dimmed" mt={8}>
          {overallProgress}% complete
        </Text>
      </div>
    </aside>
  );
}
