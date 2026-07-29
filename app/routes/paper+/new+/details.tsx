import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import { requireAuth } from "#app/services/authentication.server";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth({ request });
  if (isPaperV2FlowEnabled()) {
    throw redirect("/paper/new/purpose");
  }
  throw redirect("/paper/new/legacy");
};
