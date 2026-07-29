import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "#app/routes/_index";
import { requireAuth } from "#app/services/authentication.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon
      name="square-rounded-plus-outline"
      style={{ width: "20px", height: "20px" }}
    />
  ),
  breadcrumb: "New",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  if (user.subscription_status === "inactive") {
    return redirectWithToast("/subscription", {
      type: "error",
      title: "Subscription inactive",
      description:
        "Your subscription is inactive. Please choose a plan to continue.",
    });
  }
  return null;
};

export default function NewPaperLayout() {
  return <Outlet />;
}
