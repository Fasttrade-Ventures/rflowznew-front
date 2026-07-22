# CapRover deployment

This repo deploys to CapRover as a single app, `rflowz-web`, built from the
root `Dockerfile` (plain Node 20 + Remix, listens on port 3000).

## One-time setup

1. Create the `rflowz-web` app in the CapRover dashboard.
2. App Configs → **HTTP Settings** → set the container HTTP port to `3000`
   (the Dockerfile exposes 3000, not CapRover's default 80).
3. Set environment variables (see `.env.example`): `APP_URL`, `API_HOST`,
   `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
4. Generate an **App Token** (App Configs → "Enable App Token") and store it
   as the `CAPROVER_APP_TOKEN_WEB` GitHub Actions repo secret.
5. Set the shared `CAPROVER_SERVER` repo secret to the CapRover machine URL,
   e.g. `https://captain.channel-2.hirix.ai`.
6. Register the `ghcr.io` registry in CapRover (Cluster → Docker Registry
   Configuration) with a GitHub personal access token that has
   `write:packages`, so CapRover can pull the image GitHub Actions pushes.

On push to `main`, GitHub Actions lints, typechecks, and builds the app,
then builds/pushes a Docker image to GHCR and deploys it to `rflowz-web`.
