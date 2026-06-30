import { Icon } from "#app/components/icon";
import { Outlet } from "@remix-run/react";
import { BreadcrumbHandle } from "../_index";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="file-description-outline"
      style={{ width: "20px", height: "20px" }}
    />
  ),
  breadcrumb: "Project",
};

export const PaperLayout = () => {
  return <Outlet />;
};

export default PaperLayout;
