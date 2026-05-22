FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --chown=node:node apps/music/.output ./.output

EXPOSE 3000

USER node

CMD ["node", ".output/server/index.mjs"]
