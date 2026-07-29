import { requireAuth } from "#app/services/authentication.server";
import { getPapers } from "#app/services/paper.server";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { HomeProjectsV2 } from "#app/components/v2/HomeProjectsV2";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth({ request });
  const res = await getPapers({ request });
  return json({ papers: res.data?.papers ?? [] });
};

export default function HomeProjectsPage() {
  const { papers } = useLoaderData<typeof loader>();
  return <HomeProjectsV2 papers={papers} />;
}
