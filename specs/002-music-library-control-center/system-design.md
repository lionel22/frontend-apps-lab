# System Design: Music Library Control Center Frontend

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Tasks**: [tasks.md](./tasks.md)

## Overview

The Music Library Control Center is a dedicated Nuxt 3 operator app under `apps/music`.

Its job is to expose a thin, typed, and operationally clear UI over the backend music workflows:

1. URL and upload ingestion
2. Jobs monitoring
3. Title auto-completion
4. Similar discovery in `LLM` and `catalog` modes
5. Batch ingestion from shortlisted results
6. Organization dry-run and apply
7. A lightweight dashboard derived from the same canonical read models

The frontend is intentionally API-first. It does not invent music-domain logic locally; it normalizes backend contracts, manages operator state, and renders resilient workflows.

## Frozen MVP Contract Decisions

1. `GET /api/v1/music/ingestions` is the canonical read surface for jobs monitoring and dashboard KPI derivation.
2. Async refresh is polling-only for MVP. No SSE-specific store or composable is required.
3. Auto-complete suggestions expose a stable `reference` payload.
4. Organization dry-run is normalized to `summary`, `plannedMoves`, `skippedConflicts`, and `ignoredItems`.
5. Provider failures stay explicit. The UI offers retry and manual mode switching, but no automatic fallback across modes.
6. Upload-limit copy defaults to the backend MVP limit of 100 MB until a richer capability endpoint exists.
7. When auth is enabled, a shared operator bearer token is captured once and attached by the API adapter on every music request.
8. `POST /api/v1/music/organize` uses `dryRun` to distinguish preview from execution and returns a stable apply summary payload when `dryRun=false`.

## Design Principles

1. API-first normalization: all HTTP normalization happens in `useMusicApi` and workflow composables, never in route components.
2. One canonical jobs read model: list, filters, summary counts, and dashboard cards reuse the same store state.
3. Summary-first UX: destructive and verbose workflows show concise summaries before detailed lists.
4. Explicit operator state: every route supports `loading`, `error`, `empty`, and `success` without ambiguous silent states.
5. Desktop and mobile viable: the UI is responsive, but not visually overbuilt.

## Architecture Layers

```text
Pages
  /               dashboard
  /ingestion      url + upload entry
  /jobs           monitoring + filters
  /discovery      autocomplete + similar + batch
  /organize       dry-run + apply

Components
  shared/         loading, empty, error, dialogs, notifications
  ingestion/      URL form, upload form
  jobs/           list, toolbar, status chips
  discovery/      autocomplete, similar form, shortlist, selection bar
  organize/       rule form, summary, diff list, apply dialog
  dashboard/      KPI cards, recent activity

Composables
  useMusicApi
  usePolling
  useNotifications
  useIngestionActions
  useSimilarDiscovery
  useBatchIngestion
  useOrganizationWorkflow

Stores
  music           canonical data and async state
  ui              view state, alerts, dialogs, filters
```

## Route Responsibilities

### `/`

- Shows KPI cards derived from the canonical jobs list summary counts.
- Shows recent activity derived from the same jobs state plus recent organization and discovery outcomes when available.

### `/ingestion`

- Hosts URL submission and file upload.
- Reuses selected auto-complete suggestions as optional prefill input.
- Redirects or links to `/jobs` after successful submission.

### `/jobs`

- Renders the canonical jobs list.
- Supports status filtering, manual refresh, and configurable polling.
- Exposes summary counts already returned by the same backend list response.

### `/discovery`

- Hosts title auto-completion.
- Lets operators launch similar search in `LLM` or `catalog` mode.
- Displays provider provenance.
- Maintains stable multi-selection and submits batch ingestion.

### `/organize`

- Captures rule selection and dry-run requests.
- Renders summary-first results.
- Requires explicit confirmation before apply.

## Canonical Frontend Models

```ts
interface SuggestionReference {
  provider: string
  externalId?: string
  title: string
  artist?: string
  label: string
  resolvedUrl?: string
}

interface IngestionJobViewModel {
  id: string
  sourceLabel: string
  status: 'queued' | 'processing' | 'success' | 'failed'
  updatedAt: string
  errorMessage?: string
}

interface JobsListResponseViewModel {
  items: IngestionJobViewModel[]
  summaryCounts: {
    queued: number
    processing: number
    success: number
    failed: number
    active: number
    recentFailures: number
  }
  nextCursor?: string
}

interface SimilarResultViewModel {
  reference: SuggestionReference
  title: string
  artist?: string
  providerUsed: string
  confidence?: number
  resolvedUrl?: string
}

interface OrganizationDryRunViewModel {
  summary: {
    plannedMoveCount: number
    conflictCount: number
    ignoredCount: number
  }
  plannedMoves: Array<{ fromPath: string; toPath: string }>
  skippedConflicts: Array<{ path: string; reason: string }>
  ignoredItems: Array<{ path: string; reason: string }>
}
```

## API Contract Mapping

### `POST /api/v1/music/ingestions`

- Consumed by `useIngestionActions`.
- UI reaction under 200 ms: disable submit, show pending state, clear stale errors.

### `POST /api/v1/music/ingestions/upload`

- Same workflow abstraction as URL ingestion.
- Upload-limit copy defaults to 100 MB if no richer backend capability surface exists.

### `GET /api/v1/music/ingestions`

- Canonical jobs read surface.
- Query params: `status?`, `limit?`, optional cursor or recent-window depending on backend implementation.
- Returns both rows and summary counts.
- Used by `/jobs` and `/`.

### `GET /api/v1/music/search/titles/autocomplete`

- Triggered with debounce and minimum query length.
- Returns reusable `reference` payloads, not page-local ad hoc shapes.

### `POST /api/v1/music/search/similar`

- Accepts seed reference plus `mode`.
- Returns normalized shortlist with `providerUsed`.
- Provider errors surface as explicit controlled UI states.

### `POST /api/v1/music/ingestions/batch-from-search`

- Accepts shortlisted selections.
- Returns created job IDs and initial tracking state.
- Success path hands off naturally to `/jobs`.

### `POST /api/v1/music/organize`

- Supports dry-run and apply.
- Dry-run response uses the frozen normalized shape.
- Apply requests use the same endpoint with `dryRun=false`.
- Apply response returns `organizationRunId`, `summary`, `appliedMoves`, `skippedConflicts`, `ignoredItems`, and per-item errors when present.

## Polling Strategy

Polling is the only MVP async transport.

Recommended defaults:

1. Jobs page: 10 seconds
2. Dashboard summary: 15 to 30 seconds
3. Discovery and organization: no background polling unless tied to created jobs

Polling state lives in composables and store helpers, not directly in components.

## Auth Bootstrap

When `NUXT_PUBLIC_MUSIC_REQUIRE_AUTH` is true:

1. the app prompts once for the shared operator bearer token
2. the token is stored under a stable frontend session key
3. `useMusicApi` attaches `Authorization: Bearer <token>` on all music API requests
4. `401` clears the session token and returns the operator to the auth prompt instead of silently retrying

## Error Handling

The UI handles backend outcomes consistently:

1. `401` or `403`: show auth or permission state without destroying local draft input.
2. `422`: map field errors back to forms.
3. `429`: show controlled retry guidance.
4. `5xx` or network failure: show route-safe error state with retry.
5. Provider failure: keep the current query and selection state intact, with no auto-fallback.

## Accessibility And Feedback Rules

1. Keyboard traversal covers ingestion, discovery selection, batch submit, dry-run review, and apply confirmation.
2. Critical actions expose immediate feedback through button state, spinner, or inline status.
3. Error, loading, and confirmation states maintain sufficient contrast.
4. Large dry-run payloads use summary-first cards and collapsible details.

## Testing Strategy

1. Adapter tests cover API normalization for jobs list, autocomplete, similar search, batch submission, and organization.
2. Composable and store tests cover polling, selection persistence, notifications, and confirmation gating.
3. Component tests cover URL submission, upload, jobs filtering, discovery, and organization review flows.
4. Manual smoke checks cover desktop, mobile, keyboard-only, immediate feedback, and critical-state readability.

## File Structure

```text
apps/music/src/
  components/
    dashboard/
    discovery/
    ingestion/
    jobs/
    organize/
    shared/
  composables/
  layouts/
  pages/
  stores/
  test/
  types/
  utils/
```
