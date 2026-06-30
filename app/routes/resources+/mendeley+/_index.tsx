import { searchMendeleyCitationsByQuery } from "#app/services/mendeley.server";
import { invariant } from "@epic-web/invariant";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@remix-run/node";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  console.log(params);

  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  invariant(query, "Query is required");
  const res = await searchMendeleyCitationsByQuery({
    request,
    query,
  });
  return json({ citations: res.data?.citations });
};

export const action = async ({ request }: ActionFunctionArgs) => {};

export type GetMendeleyCitationsByQueryLoaderData = SerializeFrom<
  typeof loader
>;
