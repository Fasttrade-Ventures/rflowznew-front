import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "#app/routes/_index";
import { requireAuth } from "#app/services/authentication.server";
import { getCurrentUserSubscription } from "#app/services/subscription.server";
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

  // Block entry to the wizard if the user has exhausted their proposal quota
  try {
    const subRes = await getCurrentUserSubscription({ request });
    const features = subRes.data?.features;
    if (
      features &&
      !features.unlimited_proposals &&
      features.proposal_limit_remaining !== undefined &&
      features.proposal_limit_remaining !== null &&
      features.proposal_limit_remaining <= 0
    ) {
      return redirectWithToast("/home/projects", {
        type: "error",
        title: "Project limit reached",
        description:
          "You have used your project quota for this month. Upgrade your plan to create more projects.",
      });
    }
  } catch {
    // Non-blocking — if subscription check fails, let them proceed and the API will gate it
  }

  return null;
};

export default function NewPaperLayout() {
  return <Outlet />;
}
