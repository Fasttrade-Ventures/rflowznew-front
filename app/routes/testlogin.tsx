import { authenticator } from "#app/services/auth.server";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request);
  return json({ user });
};

export const NewPage = () => {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <div>
      <pre>test{JSON.stringify(loaderData, null, 2)}</pre>
    </div>
  );
};

export default NewPage;
