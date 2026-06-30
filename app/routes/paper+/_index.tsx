import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return redirect("/");
};

export const PaperListPage = () => {
  return <div>PaperListPage</div>;
};

export default PaperListPage;
