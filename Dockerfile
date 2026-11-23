FROM node:22-bookworm-slim AS build

ENV COREPACK_HOME=/tmp/corepack
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@11.25.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build
RUN pnpm install --prod --frozen-lockfile

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    DATABASE_PATH=/data/bot.sqlite
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libstdc++6 ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /data \
    && chown node:node /data

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
VOLUME ["/data"]
CMD ["node", "dist/index.js"]
