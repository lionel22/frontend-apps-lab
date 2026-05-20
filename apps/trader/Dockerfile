FROM --platform=$BUILDPLATFORM node:20-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /workspace

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY apps/trader/package.json apps/trader/package.json

RUN --mount=type=cache,id=trader-frontend-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build

COPY apps/trader apps/trader

RUN test -f apps/trader/.env || : > apps/trader/.env
RUN pnpm --filter @trader-frontend/trader build
RUN test -f apps/trader/.output/server/index.mjs

FROM --platform=$TARGETPLATFORM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=build --chown=node:node /workspace/apps/trader/.output ./.output

EXPOSE 3000

USER node

CMD ["node", ".output/server/index.mjs"]
