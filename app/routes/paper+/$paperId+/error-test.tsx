import { GeneralErrorBoundary } from "#app/components/error-boundary";
import { invariantResponse } from "@epic-web/invariant";
import { json, LoaderFunctionArgs } from "@remix-run/node";

export const loader = ({ request }: LoaderFunctionArgs) => {
  // throw new Error("Unexpected error");

  // throw json({ message: "Not Found" }, { status: 404 });

  // invariantResponse(false, "Forbidden", { status: 404 });

  // Mock user request
  // const user = null;
  // if (!user) {
  //   const error = new Error("User not found");
  //   error.stack = new Error().stack;
  //   throw error;
  // }
  // return null;

  // invariantResponse(false, "dada", { status: 403 });

  return null;
};

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        403: ({ error }) => (
          <p>You are not allowed to do that: {error?.data}</p>
        ),
        // 404: ({ error }) => {
        //   return <p>Tak boleh buek camtu bang: {error?.data.message}</p>;
        // },
      }}
    />
  );
}

const PaperErrorTestPage = () => {
  return (
    <div>
      <Paper>Error Test Page</Paper>
    </div>
  );
};

export default PaperErrorTestPage;
