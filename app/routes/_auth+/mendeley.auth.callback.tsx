import { mendeleyAuthCallback } from "#app/services/authentication.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  console.log("url", url);
  console.log("code", code);

  if (!code) {
    return redirectWithToast("/login", {
      type: "error",
      title: "Mendeley link failed",
      description: "Please try again",
    });
  }

  const res = await mendeleyAuthCallback({ code, request });

  if (res.data?.success) {
    return redirectWithToast("/profile", {
      type: "success",
      description: "Mendley account linked successfully",
    });
  } else {
    return redirectWithToast("/profile", {
      type: "error",
      description: "Mendley account link failed",
    });
  }
};

export const MendeleyAuthCallbackPage = () => {
  return <div>MendeleyAuthCallbackPage</div>;
};

export default MendeleyAuthCallbackPage;
