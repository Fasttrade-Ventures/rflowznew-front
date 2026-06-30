// app/services/session.server.ts
import { createCookieSessionStorage } from "@remix-run/node";

// export the whole sessionStorage object
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // use any name you want here
    // sameSite: "lax", // this helps with CSRF
    // path: "/", // remember to add this so the cookie will work in all routes
    // httpOnly: true, // for security reasons, make this cookie http only
    // secrets: ["s3cr3t"], // replace this with an actual secret
    // secure: true, // enable this in prod only
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET || "secret"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

// you can also export the methods individually for your own usage
export const { getSession, commitSession, destroySession } = sessionStorage;
