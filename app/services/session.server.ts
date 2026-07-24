// app/services/session.server.ts
import { createCookieSessionStorage } from "@remix-run/node";
import { getSessionSecret, useSecureCookies } from "#app/utils/env.server";

// export the whole sessionStorage object
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    secure: useSecureCookies(),
    secrets: [getSessionSecret()],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

// you can also export the methods individually for your own usage
export const { getSession, commitSession, destroySession } = sessionStorage;
