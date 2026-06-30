// app/services/auth.server.ts
import customFetch from "#app/utils/customFetch";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { sessionStorage } from "./session.server";
import { GoogleStrategy } from "remix-auth-google";

export interface User {
  token: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "superadmin" | "admin" | "partner" | "user";
  color_theme: string;
  scale: "xs" | "sm" | "md" | "lg" | "xl";
  is_mendeley_linked: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  subscription_status: string | null;
}

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    console.log("email :>> ", email);
    console.log("password :>> ", password);

    const res = await customFetch<User>({
      url: "/api/login",
      method: "post",
      data: JSON.stringify({
        email: email.replace(/^"|"$/g, ""),
        password: password.replace(/^"|"$/g, ""),
      }),
    });

    const user = res.data;

    return user!;
  }),
  "user-pass"
);

// Google Strategy
authenticator.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.APP_URL}/auth/google/callback`,
      scope: ["profile", "email"],
    },

    async ({ accessToken, refreshToken, extraParams, profile }) => {
      try {
        const res = await customFetch<User>({
          url: "/api/g-login",
          method: "post",
          data: JSON.stringify({ access_token: accessToken }),
        });

        const user = res.data;

        return user!;
      } catch (error) {
        console.log("error :>> ", error);
        throw new Error("Failed to authenticate with the backend");
      }
    }
  ),
  "google"
);

export async function getUser(request: Request) {
  return authenticator.isAuthenticated(request);
}

export async function updateUserTheme(request: Request, color: string) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const user = session.get("user") as User | undefined;

  if (user) {
    user.color_theme = color;
    session.set("user", user);
    return sessionStorage.commitSession(session);
  }

  return null;
}

export async function updateUserScale(
  request: Request,
  scale: "xs" | "sm" | "md" | "lg" | "xl"
) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const user = session.get("user") as User | undefined;

  if (user) {
    user.scale = scale;
    session.set("user", user);
    return sessionStorage.commitSession(session);
  }

  return null;
}

export async function updateUserSubscriptionStatus(
  request: Request,
  subscriptionStatus: string | null
) {
  console.log("Updating subscription statuszzz 🔥🔥🔥🔥");
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const user = session.get("user") as User | undefined;

  if (user) {
    console.log("User 🔥🔥🔥🔥", user);
    user.subscription_status = subscriptionStatus;
    session.set("user", user);
    return sessionStorage.commitSession(session);
  }
  console.log("NO userrr 🔥🔥🔥🔥");

  return null;
}
