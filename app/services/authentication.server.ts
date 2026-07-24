import { redirect } from "@remix-run/node";
import { commitSession, getSession } from "./session.server";
import { authenticator, User } from "./auth.server";
import customFetch from "#app/utils/customFetch";

const authenticate = async ({
  request,
  failureRedirect,
  redirectTo = "/",
}: {
  request: Request;
  failureRedirect?: string;
  redirectTo?: string | null;
}) => {
  const options = {
    throwOnError: true,
    ...(failureRedirect && { failureRedirect }),
  };

  const user = await authenticator.authenticate("user-pass", request, options);

  const redirectPath =
    redirectTo ??
    (user.role === "admin" || user.role === "superadmin" ? "/admin" : "/");

  // manually get the session
  const session = await getSession(request.headers.get("cookie"));
  // and store the user data
  session.set(authenticator.sessionKey, user);

  // commit the session
  const headers = new Headers({ "Set-Cookie": await commitSession(session) });

  throw redirect(redirectPath, { headers });
};

const requireAuth = async ({
  request,
  redirectTo,
}: {
  request: Request;
  redirectTo?: string;
}) => {
  const user = await authenticator.isAuthenticated(request);

  if (!user) {
    if (redirectTo) {
      throw redirect(`/login?redirectTo=${redirectTo}`);
    } else {
      throw redirect("/login");
    }
  }

  // Check if email is not verified
  if (user.email_verified_at === null) {
    const url = new URL(request.url);
    if (url.pathname !== "/verify-email") {
      throw redirect("/verify-email");
    }
  } else {
    // If email is verified and user is on /verify-email, redirect to home
    const url = new URL(request.url);
    if (url.pathname === "/verify-email") {
      throw redirect("/");
    }
  }

  return user;
};

const requireGuest = async ({ request }: { request: Request }) => {
  const user = await authenticator.isAuthenticated(request);

  if (user) {
    if (user.role === "admin" || user.role === "superadmin") {
      throw redirect("/admin");
    } else {
      throw redirect("/");
    }
  }

  return null;
};

const requireAdmin = async ({ request }: { request: Request }) => {
  const user = await authenticator.isAuthenticated(request);

  if (user) {
    if (user.role === "admin" || user.role === "superadmin") {
      return user;
    } else {
      throw redirect("/"); // Redirect non-admin users to the dashboard
    }
  }

  throw redirect("/login"); // Redirect unauthenticated users to the login page
};

const register = async ({
  name,
  email,
  password,
  password_confirmation,
}: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) => {
  const res = await customFetch<{ user: User }>({
    url: "/api/register",
    method: "post",
    data: JSON.stringify({
      name: name.replace(/^"|"$/g, ""),
      email: email.replace(/^"|"$/g, ""),
      password: password.replace(/^"|"$/g, ""),
      password_confirmation: password_confirmation.replace(/^"|"$/g, ""),
    }),
  });

  return res;
};

const forgotPassword = async ({ email }: { email: string }) => {
  const res = await customFetch({
    url: "/api/forgot-password",
    method: "post",
    data: JSON.stringify({
      email: email.replace(/^"|"$/g, ""),
    }),
  });

  return res;
};

const resetPassword = async ({
  email,
  password,
  password_confirmation,
  token,
}: {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}) => {
  const res = await customFetch({
    url: "/api/reset-password",
    method: "post",
    data: JSON.stringify({
      email: email.replace(/^"|"$/g, ""),
      password: password.replace(/^"|"$/g, ""),
      password_confirmation: password_confirmation.replace(/^"|"$/g, ""),
      token: token.replace(/^"|"$/g, ""),
    }),
  });

  return res;
};

const verifyEmail = async ({
  request,
  data,
}: {
  request: Request;
  data: { id: string; hash: string; expires: string; signature: string };
}) => {
  const res = await customFetch<{ message: string; user: User }>({
    request,
    url: `/api/email/verify/${data.id}/${data.hash}?expires=${data.expires}&signature=${data.signature}`,
    method: "get",
  });
  return res;
};

const linkMendeley = async ({ request }: { request: Request }) => {
  const res = await customFetch<{ redirect_url: string }>({
    request,
    url: "/api/auth/mendeley",
    method: "get",
  });

  return res;
};

const resendVerificationEmail = async ({ request }: { request: Request }) => {
  const res = await customFetch<{ message: string }>({
    request,
    url: `/api/email/resend`,
    method: "get",
  });
  return res.data?.message;
};

const mendeleyAuthCallback = async ({
  code,
  request,
}: {
  code: string;
  request: Request;
}) => {
  const res = await customFetch<{ success: boolean }>({
    request,
    url: "/api/auth/mendeley/callback",
    method: "post",
    data: JSON.stringify({
      code: code.replace(/^"|"$/g, ""),
    }),
  });

  return res;
};

const unlinkMendeley = async ({ request }: { request: Request }) => {
  const res = await customFetch<{ success: boolean }>({
    request,
    url: "/api/auth/mendeley/unlink",
    method: "post",
  });

  return res;
};

const getCurrentUser = async ({ request }: { request: Request }) => {
  const res = await customFetch<User>({
    request,
    url: "/api/user",
    method: "get",
  });

  return res;
};

const updateUser = async ({
  user,
  request,
}: {
  user: Partial<User>;
  request: Request;
}) => {
  const res = await customFetch<User>({
    request,
    url: `/api/profile/${user.id}`,
    method: "put",
    data: JSON.stringify(user),
  });

  return res;
};

export {
  authenticate,
  requireAuth,
  requireGuest,
  requireAdmin,
  register,
  forgotPassword,
  resetPassword,
  mendeleyAuthCallback,
  linkMendeley,
  unlinkMendeley,
  getCurrentUser,
  updateUser,
  verifyEmail,
  resendVerificationEmail,
};
