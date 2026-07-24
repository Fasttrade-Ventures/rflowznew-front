function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    console.warn(
      "[rflowz] SESSION_SECRET is not set — login sessions will not persist reliably in production."
    );
  }
  return secret || "secret";
}

export function useSecureCookies(): boolean {
  const explicit = parseBoolean(process.env.SESSION_SECURE);
  if (explicit !== undefined) return explicit;

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) return appUrl.startsWith("https://");

  return process.env.NODE_ENV === "production";
}

export function getApiHost(): string {
  const apiHost = process.env.API_HOST?.trim().replace(/\/$/, "");
  if (!apiHost) {
    throw new Error(
      "API_HOST is not set. Configure it in CapRover for rflowz-web."
    );
  }
  return apiHost;
}

export function getAblyKey(): string {
  const key = process.env.ABLY_KEY?.trim();
  if (!key) {
    throw new Error(
      "ABLY_KEY is not set. Use the same value as api-rflowz ABLY_KEY."
    );
  }
  return key;
}

export function getAppUrl(): string {
  const appUrl = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (!appUrl) {
    throw new Error("APP_URL is not set.");
  }
  return appUrl;
}

export function getGoogleOAuthConfig(): {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
} {
  const clientID = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientID || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in fe-rflowz/.env (restart npm run dev after changing)."
    );
  }

  return {
    clientID,
    clientSecret,
    callbackURL: `${getAppUrl()}/auth/google/callback`,
  };
}
