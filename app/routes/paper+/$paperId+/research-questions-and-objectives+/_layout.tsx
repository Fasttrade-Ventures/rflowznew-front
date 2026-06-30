import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "#app/routes/_index";
import { Outlet } from "@remix-run/react";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="number-3-small-outline"
      style={{ width: "20px", height: "30px" }}
    />
  ),
  breadcrumb: "Questions and Objectives",
};

export const ResearchQuestionsAndObjectivesLayout = () => {
  return <Outlet />;
};

export default ResearchQuestionsAndObjectivesLayout;
