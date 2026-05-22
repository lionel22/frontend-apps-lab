# Trader Frontend

Frontend Nuxt 3 de l'application `trader`.

## Dev local

```bash
pnpm install
pnpm --filter @trader-frontend/trader dev
```

Le frontend lit sa configuration publique via [`apps/trader/.env.example`](./.env.example).

## Build d'image Docker

Pattern aligne sur `route54`: un build local simple et une variante `buildx --push`.

Artefact actuellement pousse pour l'environnement de dev/integration:

- `ghcr.io/digitalyser/trader-frontend:dev`
- plateforme runtime cible: `linux/amd64`

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

## Handoff deployment infra

Le conteneur embarque un serveur Nuxt/Nitro et ecoute par defaut sur le port `3000`.

- image: `ghcr.io/digitalyser/trader-frontend:dev`
- type d'app: Nuxt 3 SSR / Nitro server
- port conteneur: `3000`
- protocole: HTTP
- rebuild non requis pour changer les variables `runtimeConfig.public`

## Variables runtime du conteneur

Source de verite locale: [`apps/trader/.env.example`](./.env.example).

| Variable | Requis | Defaut | Usage |
| --- | --- | --- | --- |
| `HOST` | non | `0.0.0.0` | bind du serveur Nitro |
| `PORT` | non | `3000` | port d'ecoute du conteneur |
| `NUXT_PUBLIC_TRADER_API_BASE_URL` | oui | aucune | base URL canonique du backend trader |
| `NUXT_PUBLIC_POLLING_INTERVAL_DEFAULT` | non | `30000` | polling par defaut des vues globales |
| `NUXT_PUBLIC_POLLING_INTERVAL_POSITIONS` | non | `5000` | polling des positions |
| `NUXT_PUBLIC_POLLING_INTERVAL_TRADES` | non | `10000` | polling des trades |
| `NUXT_PUBLIC_TRADER_REQUIRE_AUTH` | non | `true` | active le garde d'authentification cote frontend |
| `NUXT_PUBLIC_TRADER_AUTH_TOKEN` | non | vide | token public injecte au navigateur, a eviter sauf usage explicitement assume |

Comme la configuration est portee par `runtimeConfig.public`, ces variables peuvent etre injectees au runtime pour Docker Compose ou Kubernetes sans rebuilder l'image.

Compatibilite: `NUXT_PUBLIC_API_URL` reste accepte comme alias legacy, mais `NUXT_PUBLIC_TRADER_API_BASE_URL` est la variable de reference a utiliser pour les nouveaux environnements.

Important: toute variable prefixee par `NUXT_PUBLIC_` est exposee au navigateur. Ne pas y stocker de secret.

## Lancement

### Docker run

```bash
docker run --rm \
  --name trader-frontend \
  -p 3001:3000 \
  --env-file apps/trader/.env.example \
  ghcr.io/digitalyser/trader-frontend:dev
```

### Docker Compose

```yaml
services:
  trader-frontend:
    image: ghcr.io/digitalyser/trader-frontend:dev
    env_file:
      - ./apps/trader/.env
    ports:
      - '3001:3000'
```

### HelmRelease / values

```yaml
image:
  repository: ghcr.io/digitalyser/trader-frontend
  tag: dev

env:
  PORT: '3000'
  NUXT_PUBLIC_TRADER_API_BASE_URL: https://api.example.com
  NUXT_PUBLIC_POLLING_INTERVAL_DEFAULT: '30000'
  NUXT_PUBLIC_POLLING_INTERVAL_POSITIONS: '5000'
  NUXT_PUBLIC_POLLING_INTERVAL_TRADES: '10000'
  NUXT_PUBLIC_TRADER_REQUIRE_AUTH: 'true'

envFrom:
  - secretRef:
      name: trader-frontend-secrets
```

Le seul secret potentiel cote frontend est `NUXT_PUBLIC_TRADER_AUTH_TOKEN`, a utiliser seulement si vous acceptez qu'il soit expose au navigateur. Par defaut, preferer une authentification utilisateur normale.

## Notes infra

- Si vous avez besoin d'un healthcheck, utilisez un probe HTTP simple sur `/` ou un probe TCP sur le port `3000`. Aucun endpoint dedie `/healthz` n'est expose aujourd'hui.
- Pour un deploiement non-dev, remplacez le tag `dev` par un tag immutable (`git-sha` ou semver) mais gardez le meme contrat d'env.
