import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "#app/routes/_index";
import { Outlet } from "@remix-run/react";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="number-1-small-outline"
      style={{ width: "20px", height: "30px" }}
    />
  ),
  breadcrumb: "Literature Review",
};

export const PaperLiteratureReviewLayout = () => {
  return <Outlet />;
};

export default PaperLiteratureReviewLayout;
