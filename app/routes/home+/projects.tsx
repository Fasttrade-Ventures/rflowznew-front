import { getLibraryEntries } from "#app/services/library.server";
import { requireAuth } from "#app/services/authentication.server";
import { getPapers } from "#app/services/paper.server";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { HomeProjectsV2 } from "#app/components/v2/HomeProjectsV2";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth({ request });
  const res = await getPapers({ request });
  const papers = res.data?.papers ?? [];

  const libraryResults = await Promise.all(
    papers.map(async (paper) => {
      const libraryRes = await getLibraryEntries({
        request,
        paperId: String(paper.id),
      });
      return libraryRes.data?.entries ?? [];
    })
  );

  return json({
    papers,
    citationsSaved: libraryResults.flat().length,
  });
};

export default function HomeProjectsPage() {
  const { papers, citationsSaved } = useLoaderData<typeof loader>();
  return <HomeProjectsV2 papers={papers} citationsSaved={citationsSaved} />;
}
