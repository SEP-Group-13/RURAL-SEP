FROM node:24-bookworm-slim AS base

WORKDIR /app

# npm ci needs the manifest of every workspace listed in the lockfile.
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/


# Development: backend only, with the watcher. compose.yaml mounts the sources over these copies.
FROM base AS dev

RUN npm ci --workspace server --workspace shared && chown node:node /app

COPY --chown=node:node server ./server
COPY --chown=node:node shared ./shared
COPY --chown=node:node public ./public

ENV NODE_ENV=development HOST=0.0.0.0 PORT=3000
EXPOSE 3000

USER node
CMD ["npm", "run", "dev:server"]


# Build the client (static SPA) and the bundled server into dist/.
FROM base AS build

RUN npm ci

COPY client ./client
COPY server ./server
COPY shared ./shared

RUN npm run build


# Production: server runtime dependencies plus the built output; Express serves the client.
FROM base AS prod

# --omit=optional as well: typescript is a server devDependency but also an optional peer of
# @react-router/node, so --omit=dev alone keeps it (~30 MB). Only pg-cloudflare is lost besides.
RUN npm ci --workspace server --omit=dev --omit=optional

COPY --from=build /app/dist ./dist
COPY public ./public

ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
EXPOSE 3000

USER node
CMD ["npm", "run", "prod:server"]
