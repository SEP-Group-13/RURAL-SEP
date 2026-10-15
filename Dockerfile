FROM node:24-bookworm-slim

WORKDIR /app

# Install the locked backend dependencies, including the development watcher.
COPY package.json package-lock.json ./
RUN npm ci && chown node:node /app

COPY --chown=node:node server ./server
COPY --chown=node:node shared ./shared
COPY --chown=node:node public ./public

ENV NODE_ENV=development HOST=0.0.0.0 PORT=3000
EXPOSE 3000

USER node
CMD ["npm", "run", "dev:server"]
