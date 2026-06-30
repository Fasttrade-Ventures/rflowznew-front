import { authenticator } from "#app/services/auth.server";
import type { LoaderFunctionArgs } from "@remix-run/node";

export let loader = ({ request }: LoaderFunctionArgs) => {
  return authenticator.authenticate("google", request, {
    successRedirect: "/",
    failureRedirect:
      "/login?googleSignInErrorMessage=Failed to authenticate with Google, Please try again later or use another method or account",
  });
};
