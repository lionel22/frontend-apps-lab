FROM node:20-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /workspace

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY apps/music/package.json apps/music/package.json

RUN --mount=type=cache,id=music-frontend-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build

COPY apps/music apps/music

RUN test -f apps/music/.env || : > apps/music/.env
RUN pnpm --filter @music-frontend/music build
RUN test -f apps/music/.output/server/index.mjs

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=build --chown=node:node /workspace/apps/music/.output ./.output

EXPOSE 3000

USER node

CMD ["node", ".output/server/index.mjs"]
