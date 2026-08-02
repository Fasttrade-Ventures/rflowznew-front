import { getLibraryEntries } from "#app/services/library.server";
import { requireAuth } from "#app/services/authentication.server";
import { deletePaper, getPapers } from "#app/services/paper.server";
import { invariant } from "@epic-web/invariant";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/node";
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

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAuth({ request });
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete-paper") {
    const paperId = formData.get("paperId");
    invariant(typeof paperId === "string" && paperId, "paperId is required");
    try {
      await deletePaper({ paperId, request });
      return json({ ok: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete project";
      return json({ ok: false, error: message }, { status: 500 });
    }
  }

  return json({ ok: false }, { status: 400 });
};

export default function HomeProjectsPage() {
  const { papers, citationsSaved } = useLoaderData<typeof loader>();
  return <HomeProjectsV2 papers={papers} citationsSaved={citationsSaved} />;
}
