import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "#app/routes/_index";
import { Outlet } from "@remix-run/react";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="number-7-small-outline"
      style={{ width: "20px", height: "30px" }}
    />
  ),
  breadcrumb: "Point of Departure",
};

export const PaperPoDLayout = () => {
  return <Outlet />;
};

export default PaperPoDLayout;
