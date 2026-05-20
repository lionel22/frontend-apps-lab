# Trader Frontend

Frontend Nuxt 3 de l'application `trader`.

## Dev local

```bash
pnpm install
pnpm --filter @trader-frontend/trader dev
```

Le frontend lit sa configuration publique via [`apps/trader/.env.example`](./.env.example).

## Build d'image Docker

Pattern aligne sur `route54`: un build local simple et une variante `buildx --push`, avec image et plateforme fixees en dur.

```bash
# Depuis la racine du repo
pnpm trader:image:build

# Ou depuis l'app
pnpm --filter @trader-frontend/trader image:build

# Commande executee
docker build -f apps/trader/Dockerfile -t ghcr.io/digitalyser/trader-frontend:dev .
```

```bash
pnpm trader:image:build:push

# Commande executee
docker buildx build -f apps/trader/Dockerfile --push --platform linux/amd64 --tag ghcr.io/digitalyser/trader-frontend:dev .
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
  ghcr.io/digitalyser/trader-frontend:0.1.0
```

### Docker Compose

```yaml
services:
  trader-frontend:
    image: ghcr.io/digitalyser/trader-frontend:0.1.0
    env_file:
      - ./apps/trader/.env
    ports:
      - '3001:3000'
```

### HelmRelease / values

```yaml
image:
  repository: ghcr.io/digitalyser/trader-frontend
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
