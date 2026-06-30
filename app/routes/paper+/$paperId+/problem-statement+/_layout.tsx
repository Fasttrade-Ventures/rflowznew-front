import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "#app/routes/_index";
import { Outlet } from "@remix-run/react";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="number-2-small-outline"
      style={{ width: "20px", height: "30px" }}
    />
  ),
  breadcrumb: "Problem Statement",
};

export const ProblemStatementLayout = () => {
  return <Outlet />;
};

export default ProblemStatementLayout;
