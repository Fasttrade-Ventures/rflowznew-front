# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.12.2
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Remix"

# Remix app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# mermaid-cli pulls in puppeteer as a peer dep for CLI-only diagram
# rendering; this app renders mermaid client-side (see
# app/utils/render-mermaid.ts) and never launches puppeteer's Chrome,
# so skip its binary download rather than installing unzip just to
# throw the browser away in the prune step below.
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY --link . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start" ]
