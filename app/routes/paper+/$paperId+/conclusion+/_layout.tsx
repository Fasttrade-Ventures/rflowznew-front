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
  breadcrumb: "Conclusion",
};

export const PaperConclusionLayout = () => {
  return <Outlet />;
};

export default PaperConclusionLayout;
