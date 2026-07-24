# CapRover deployment

This repo deploys to CapRover as a single app, `rflowz-web`, built from the
root `Dockerfile` (plain Node 20 + Remix, listens on port 3000).

## One-time setup

1. Create the `rflowz-web` app in the CapRover dashboard.
2. App Configs → **HTTP Settings** → set the container HTTP port to `3000`
   (the Dockerfile exposes 3000, not CapRover's default 80).
3. Enable **HTTPS** on the app (required for login cookies in production).
4. Set environment variables (see below).
5. Generate an **App Token** (App Configs → "Enable App Token") and store it
   as the `CAPROVER_APP_TOKEN_WEB` GitHub Actions repo secret.
6. Set the shared `CAPROVER_SERVER` repo secret to the CapRover machine URL,
   e.g. `https://captain.channel-2.hirix.ai`.
7. Register the `ghcr.io` registry in CapRover (Cluster → Docker Registry
   Configuration) with a GitHub personal access token that has
   `write:packages`, so CapRover can pull the image GitHub Actions pushes.

## Required environment variables (`rflowz-web`)

| Variable | Example | Notes |
|----------|---------|-------|
| `APP_URL` | `https://app.rflowz.com` | Public frontend URL, **https**, no trailing slash |
| `API_HOST` | `https://api.rflowz.com` | Public API URL, **https**, no trailing slash |
| `SESSION_SECRET` | long random string | **Required** — signs the login session cookie |
| `NODE_ENV` | `production` | Already set in Dockerfile |
| `GOOGLE_CLIENT_ID` | … | If using Google login |
| `GOOGLE_CLIENT_SECRET` | … | If using Google login |

Optional:

| Variable | Example | Notes |
|----------|---------|-------|
| `SESSION_SECURE` | `true` / `false` | Override cookie `Secure` flag (defaults from `APP_URL`) |

Generate a session secret:

```bash
openssl rand -base64 48
```

## Login redirect loop (troubleshooting)

If login works locally but production bounces back to `/login`, check these in order:

### 1. `SESSION_SECRET` missing on `rflowz-web`

The Remix app stores the user + API token in an encrypted cookie. Without a
stable `SESSION_SECRET` in CapRover, the cookie cannot be read on the next
request.

**Fix:** Set `SESSION_SECRET` in CapRover → `rflowz-web` → App Configs →
Environment Variables, then redeploy.

### 2. `APP_URL` / `API_HOST` wrong

| Symptom | Cause |
|---------|--------|
| Login form shows error | `API_HOST` missing or unreachable from container |
| Login then instant redirect to `/login` | Session cookie not saved, or API returns 401 |

**Fix:**

```env
APP_URL=https://your-frontend-domain.com
API_HOST=https://your-api-domain.com
```

No trailing slashes. Use the **public HTTPS URLs**, not `localhost`.

### 3. HTTP instead of HTTPS

Cookies are marked `Secure` when `APP_URL` starts with `https://`. If users
open the site over plain HTTP, the browser will not send the session cookie.

**Fix:** Enable HTTPS in CapRover and open the app via `https://…`.

### 4. API returns 401 after login

After login, the home page calls `GET /api/user` with the Sanctum token. If
the API rejects it, the frontend logs the user out.

**Check on `rflowz-api`:**

- `APP_KEY` is set and stable (do not change after deploy)
- Database migrations ran (`php artisan migrate --force`)
- `personal_access_tokens` table exists
- `API_HOST` on the web app points to the **same** API instance/DB

### 5. Quick verification

From your machine:

```bash
# API health
curl -s https://your-api-domain.com/up

# Login (replace credentials)
curl -s -X POST https://your-api-domain.com/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'
```

You should get JSON with a `token` field.

## Related API app

The API is deployed separately as `rflowz-api`. See
`api-rflowz/docs/CAPROVER_DEPLOY.md`. The API must have `FRONTEND_URL` set to
the same value as `APP_URL` on `rflowz-web`.

On push to `main`, GitHub Actions lints, typechecks, and builds the app,
then builds/pushes a Docker image to GHCR and deploys it to `rflowz-web`.
