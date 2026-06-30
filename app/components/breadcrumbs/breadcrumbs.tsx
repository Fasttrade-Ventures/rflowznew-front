import { BreadcrumbHandle } from "#app/routes/_index";
import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Anchor, Breadcrumbs, Group } from "@mantine/core";
import { useMatches } from "@remix-run/react";

import classes from "./Breadcrumbs.module.css";

interface BreadcrumbItem {
  title: string;
  icon?: ReactNode;
  to: string;
}

const useBreadcrumbs = () => {
  const matches = useMatches();
  const BreadcrumbHandleMatch = z.object({
    handle: BreadcrumbHandle,
  });
  const breadcrumbs = matches
    .map((m) => {
      const result = BreadcrumbHandleMatch.safeParse(m);
      if (
        !result.success ||
        (!result.data.handle.breadcrumb &&
          !result.data.handle.dynamicBreadcrumb)
      ) {
        return null;
      }

      const dynamicBreadcrumbName =
        typeof result.data.handle.dynamicBreadcrumb === "function"
          ? result.data.handle.dynamicBreadcrumb(m.data)
          : null;

      const breadcrumb =
        dynamicBreadcrumbName || result.data.handle.breadcrumb!;

      return {
        title: breadcrumb as string,
        icon: result.data.handle.icon,
        to: m.pathname,
      };
    })
    .filter(Boolean) as BreadcrumbItem[];

  return breadcrumbs;
};

const BreadcrumbsComponent = () => {
  const breadcrumbs = useBreadcrumbs();

  return (
    <Breadcrumbs
      separator="→"
      separatorMargin={5}
      classNames={{
        separator: classes.seperator,
      }}
    >
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index !== breadcrumbs.length - 1 ? (
            <Anchor
              component={Link}
              to={item.to}
              size="sm"
              className={classes.breadcrumb}
            >
              <Group align="center" gap={5} wrap="nowrap">
                {item.icon && item.icon}
                {item.title}
              </Group>
            </Anchor>
          ) : (
            <Anchor size="sm" key={index} mod={{ disabled: true }}>
              <Group align="center" gap={5} wrap="nowrap">
                {item.icon && item.icon}
                {item.title}
              </Group>
            </Anchor>
          )}
        </React.Fragment>
      ))}
    </Breadcrumbs>
  );
};

export default BreadcrumbsComponent;
