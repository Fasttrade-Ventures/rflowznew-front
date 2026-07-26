import { suggestOpenAlexCitations } from "#app/services/openalex.server";
import { invariant } from "@epic-web/invariant";
import { ActionFunctionArgs, json, SerializeFrom } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const paperId = formData.get("paperId");
  const section = formData.get("section");
  const keywordsRaw = formData.get("keywords");

  invariant(typeof paperId === "string" && paperId, "paperId is required");

  const keywords =
    typeof keywordsRaw === "string" && keywordsRaw.length > 0
      ? keywordsRaw.split(",").map((k) => k.trim())
      : undefined;

  const res = await suggestOpenAlexCitations({
    request,
    paperId,
    section: typeof section === "string" ? section : undefined,
    keywords,
  });

  return json({
    suggestions: res.data?.suggestions ?? [],
    success: res.data?.success ?? false,
  });
};

export type SuggestOpenAlexCitationsActionData = SerializeFrom<typeof action>;
