import { isPaperV2FlowEnabled } from "#app/utils/feature-flags.server";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;

  // V2 simulation flow lands on Library; legacy DSR still opens Background study.
  if (isPaperV2FlowEnabled()) {
    return redirect(`/paper/${paperId}/library`);
  }

  return redirect(`/paper/${paperId}/introduction`);
};

export const PaperDetailPage = () => {
  const params = useParams();

  return <div>PaperDetailPage: {params.paperId}</div>;
};

export default PaperDetailPage;
