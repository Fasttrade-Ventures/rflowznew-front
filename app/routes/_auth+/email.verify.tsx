import { authenticator } from "#app/services/auth.server";
import { verifyEmail } from "#app/services/authentication.server";
import { commitSession, getSession } from "#app/services/session.server";
import { redirectWithToast } from "#app/utils/toast.server";
import { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const expires = url.searchParams.get("expires");
  const hash = url.searchParams.get("hash");
  const id = url.searchParams.get("id");
  const signature = url.searchParams.get("signature");

  if (!expires || !hash || !id || !signature) {
    throw await redirectWithToast("/", {
      description: "Invalid verification link",
      type: "error",
    });
  }

  const user = await authenticator.isAuthenticated(request);
  if (user && user.email_verified_at) {
    throw await redirectWithToast(`/`, {
      description: "Email already verified",
      type: "error",
    });
  }

  try {
    const res = await verifyEmail({
      request,
      data: { expires, hash, id, signature },
    });

    const session = await getSession(request.headers.get("cookie"));
    session.set(authenticator.sessionKey, res.data?.user);
    const headers = new Headers({
      "Set-Cookie": await commitSession(session),
    });
    return redirectWithToast(
      `/`,
      {
        title: "Verification successful",
        description: "Email verified successfully",
        type: "success",
      },
      {
        headers,
      }
    );
  } catch (error: unknown) {
    if (error instanceof Response && error.status === 302) {
      // This is a redirect, re-throw it to let Remix handle it
      throw error;
    }
    if (isErrorWithMessage(error)) {
      // return json({ success: false, message: error.data.message });
      throw await redirectWithToast(`/`, {
        description: error.data.message,
        type: "error",
      });
    } else {
      console.log("error :>> ", error);
      throw await redirectWithToast(`/`, {
        description: "Unknown error occured",
        type: "error",
      });
    }
  }
};

export const VerifyEmailPage = () => {
  return <div>VerifyEmailPage</div>;
};

export function isErrorWithMessage(
  error: unknown
): error is { message: string; data: { message: string } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof (error as { message: unknown; data: { message: unknown } })
      .message === "string"
  );
}

export default VerifyEmailPage;
