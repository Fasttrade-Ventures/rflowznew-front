import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  // const paper = await getPaperById(paperId);
  // return json(paper);
  return redirect(`/paper/${paperId}/introduction`);
};

export const PaperDetailPage = () => {
  const params = useParams();

  return <div>PaperDetailPage: {params.paperId}</div>;
};

export default PaperDetailPage;
