# Trader Frontend

Frontend Nuxt 3 de l'application `trader`.

## Dev local

```bash
pnpm install
pnpm --filter @trader-frontend/trader dev
```

Le frontend lit sa configuration publique via [`apps/trader/.env.example`](./.env.example).

## Build d'image Docker

Pattern aligne sur `route54`: un build local simple et une variante `buildx --push` pilotables par variables d'environnement.

```bash
# Depuis la racine du repo
pnpm trader:image:build

# Ou depuis l'app
pnpm --filter @trader-frontend/trader image:build
```

Variables de build supportees:

- `TRADER_FRONTEND_IMAGE_NAME` (defaut: `trader-frontend`)
- `TRADER_FRONTEND_IMAGE_TAG` (defaut: `dev`)
- `TRADER_FRONTEND_DOCKERFILE` (defaut: `apps/trader/Dockerfile`)
- `TRADER_FRONTEND_BUILD_CONTEXT` (defaut: `.`)
- `TRADER_FRONTEND_IMAGE_PLATFORM` (defaut: `linux/amd64`, uniquement pour `image:build:push`)

Exemples:

```bash
TRADER_FRONTEND_IMAGE_NAME=ghcr.io/lionel22/trader-frontend \
TRADER_FRONTEND_IMAGE_TAG=0.1.0 \
pnpm trader:image:build

TRADER_FRONTEND_IMAGE_NAME=ghcr.io/lionel22/trader-frontend \
TRADER_FRONTEND_IMAGE_TAG=0.1.0 \
TRADER_FRONTEND_IMAGE_PLATFORM=linux/amd64 \
pnpm trader:image:build:push
```

## Variables runtime du conteneur

Variables principales:

- `HOST` (defaut image: `0.0.0.0`)
- `PORT` (defaut image: `3000`)
- `NUXT_PUBLIC_API_URL`
- `NUXT_PUBLIC_POLLING_INTERVAL_DEFAULT`
- `NUXT_PUBLIC_POLLING_INTERVAL_POSITIONS`
- `NUXT_PUBLIC_POLLING_INTERVAL_TRADES`
- `NUXT_PUBLIC_TRADER_AUTH_TOKEN`
- `NUXT_PUBLIC_TRADER_REQUIRE_AUTH`

Comme la configuration est portee par `runtimeConfig.public`, ces variables peuvent etre injectees au runtime pour Docker Compose ou Kubernetes sans rebuilder l'image.

## Lancement

### Docker run

```bash
docker run --rm \
  --name trader-frontend \
  -p 3001:3000 \
  --env-file apps/trader/.env.example \
  ghcr.io/lionel22/trader-frontend:0.1.0
```

### Docker Compose

```yaml
services:
  trader-frontend:
    image: ghcr.io/lionel22/trader-frontend:0.1.0
    env_file:
      - ./apps/trader/.env
    ports:
      - '3001:3000'
```

### HelmRelease / values

```yaml
image:
  repository: ghcr.io/lionel22/trader-frontend
  tag: 0.1.0

env:
  PORT: '3000'
  NUXT_PUBLIC_API_URL: https://api.example.com
  NUXT_PUBLIC_TRADER_REQUIRE_AUTH: 'true'

envFrom:
  - secretRef:
      name: trader-frontend-secrets
```

Le seul secret potentiel cote frontend est `NUXT_PUBLIC_TRADER_AUTH_TOKEN`, a utiliser seulement si vous acceptez qu'il soit expose au navigateur. Par defaut, preferer une authentification utilisateur normale.
