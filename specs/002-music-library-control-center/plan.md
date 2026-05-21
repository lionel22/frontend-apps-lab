# Implementation Plan: Music Library Control Center Frontend

**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-20

## Summary

This feature is large enough to justify a dedicated Nuxt app under `apps/music` rather than trying to bend `apps/trader` into an unrelated operator surface.

The recommended approach is to reuse the app-level structure already proven in `apps/trader`: Nuxt 3, Pinia, Vuetify, runtime-configured API access, feature-scoped components, composables, stores, and Vitest-based app-local tests.

Recommended execution order:

1. Bootstrap the new frontend app and shell.
2. Implement API adapter, ingestion forms, and job monitoring views.
3. Implement title auto-completion and similar discovery with `LLM` and `catalog` modes.
4. Implement organization dry-run and apply flows.
5. Harden responsive behavior, accessibility, and operator feedback states.

The plan assumes a new backend app from spec `006` will expose the contracts described in its spec and plan. Frontend work can start immediately on shell, design system decisions, typed models, and mocked adapters, but real release completion depends on those backend contracts existing.

## Technical Context

### Workspace Shape Already Supports New Apps

- Root `pnpm-workspace.yaml` already includes `apps/**`.
- Root `package.json` already uses app-scoped commands for the trader frontend.

### Concrete Frontend App Patterns Already Present In Repo

- `apps/trader/nuxt.config.ts` uses `srcDir`, Pinia, Vuetify, and runtime config.
- `apps/trader/package.json` already defines `dev`, `build`, `typecheck`, `lint`, and `test` commands.
- `apps/trader/src/` follows a feature-oriented structure with `components/`, `composables/`, `stores/`, `pages/`, `types/`, `utils/`, and `test/`.
- Shared UX primitives already exist in the trader app as design references: loading, toast, dialogs, tables, notification helpers, and polling helpers.

### Recommended App-Local Technology Choices

- App path: `apps/music`
- Package name: `@music-frontend/music`
- Runtime: Nuxt 3 + Vue 3 + TypeScript
- State: Pinia
- UI: Vuetify
- Validation and testing: app-local ESLint, Nuxt typecheck, Vitest

### Recommended Runtime Configuration

- `NUXT_PUBLIC_MUSIC_API_URL`
- `NUXT_PUBLIC_MUSIC_POLLING_INTERVAL_DEFAULT`
- `NUXT_PUBLIC_MUSIC_REQUIRE_AUTH`
- `NUXT_PUBLIC_MUSIC_AUTH_STORAGE_KEY`

## Constitution Alignment

### Explicit Application Boundaries

- Build a separate frontend app under `apps/music`.
- Keep music-specific components, stores, and composables app-local until real cross-app reuse exists.
- Do not place backend contract workarounds inside components; keep all contract normalization in the API layer.

### Contracts And Inputs Validated

- Centralize backend response normalization in `useMusicApi`.
- Keep route pages thin and typed.
- Validate user input for URL submission, auto-complete thresholds, organization confirmation, and batch submission in the view model layer.

### External Integrations Isolated And Safe

- The frontend should speak only to the music backend.
- Provider-specific discovery behavior should remain backend-driven.
- The UI may expose mode or provider choice, but it must not encode provider-specific fallback logic.

### Async Workloads Observable And Idempotent

- All ingestion, search, and organization flows must present explicit `loading`, `error`, `empty`, and `success` states.
- Job polling must be centralized and repeatable.
- Batch submission should be safe to retry from the UI without corrupting local state.

### Quality Gates Match Risk

- Destructive flows such as organization apply require stronger UX validation than read-only screens.
- Discovery flows need contract tests around normalized suggestion and recommendation shapes.
- Mobile and keyboard validation are mandatory because the spec makes them core, not optional.

### Spec-Driven Delivery

- This plan is derived from [spec.md](./spec.md).
- Backend contract changes affecting discovery or organization should be written back into the spec pair before frontend implementation drifts.

## Directories And Files Likely To Change

### Root Repo Files

- `package.json` to add `music:dev`, `music:build`, `music:typecheck`, `music:lint`, `music:test`

### New Frontend App

- `apps/music/package.json`
- `apps/music/nuxt.config.ts`
- `apps/music/tsconfig.json`
- `apps/music/vitest.config.ts`
- `apps/music/Dockerfile`
- `apps/music/src/app.vue`
- `apps/music/src/assets/global.css`
- `apps/music/src/layouts/default.vue`

### New App Source Areas

- `apps/music/src/pages/**`
- `apps/music/src/components/**`
- `apps/music/src/composables/**`
- `apps/music/src/stores/**`
- `apps/music/src/types/**`
- `apps/music/src/utils/**`
- `apps/music/src/test/**`

### Spec Files

- `specs/002-music-library-control-center/plan.md`

## Research Findings

1. The backend should expose one normalized discovery contract with `LLM` and `catalog` modes rather than leaking provider-specific shapes into the UI.
2. The accepted clarification now locks the current MVP to Last.fm as the default `catalog` provider because the usage target is internal or non-commercial.
3. Deezer remains the preferred substitution path if the rollout target changes later.
4. The frontend should therefore display the active provider for transparency but avoid coupling page logic to one provider.
5. Title auto-completion and similar discovery should share selection, result-card, and batch-ingestion UI patterns.

## Contracts And Data Model Notes

### Expected Backend Endpoints

- `POST /api/v1/music/ingestions`
- `POST /api/v1/music/ingestions/upload`
- `GET /api/v1/music/ingestions`
- `GET /api/v1/music/ingestions/:id`
- `GET /api/v1/music/search/titles/autocomplete`
- `POST /api/v1/music/search/similar`
- `POST /api/v1/music/ingestions/batch-from-search`
- `POST /api/v1/music/organize`

### Frontend View Models To Normalize Early

1. `IngestionJobViewModel`
   - `id`, `sourceLabel`, `status`, `updatedAt`, `errorMessage`
2. `AutocompleteSuggestionViewModel`
   - `reference`, `title`, `artist`, `sourceLabel`, `provider`
3. `SimilarResultViewModel`
   - `reference`, `title`, `artist`, `providerUsed`, `confidence`, `downloadable`
4. `OrganizationDryRunViewModel`
   - `summary`, `plannedMoves`, `skippedConflicts`, `ignoredItems`
5. `BatchSubmissionViewModel`
   - `searchId`, `selectedReferences`, `createdJobIds`

### MVP Contract Decisions Now Frozen

1. `GET /api/v1/music/ingestions` is the canonical read surface for jobs monitoring and returns both rows and summary counts used by the dashboard.
2. Suggestion references from auto-complete normalize to a stable payload containing `provider`, `externalId` or `title/artist`, and a display label.
3. The organization dry-run payload normalizes to `summary`, `plannedMoves`, `skippedConflicts`, and `ignoredItems`.
4. Async refresh is polling-only for MVP; SSE stays out of scope until a later release proves the need.
5. Provider failures remain explicit in the UI with manual retry or mode switch; no automatic frontend fallback is implemented.
6. When auth is required, the app captures a shared operator bearer token once, stores it under a stable frontend session key, and attaches it in `useMusicApi`.
7. `POST /api/v1/music/organize` differentiates preview and execution through `dryRun`; apply responses return `organizationRunId`, `summary`, `appliedMoves`, `skippedConflicts`, `ignoredItems`, and per-item errors when present.

## Implementation Sequence And Milestones

## Phase 0: App Bootstrap And Operator Shell

**Goal**: create the new Nuxt app and a thin but stable application shell.

### Phase 0 Expected Changes

- Scaffold `apps/music` with Nuxt config, package scripts, Vitest config, base layout, and global CSS.
- Add root scripts for the new app.
- Define runtime config for music backend access.
- Add a minimal auth bootstrap for the shared operator token when `NUXT_PUBLIC_MUSIC_REQUIRE_AUTH` is enabled.
- Build a first navigation shell and route structure.

### Phase 0 Validation

- `pnpm --filter @music-frontend/music build`
- `pnpm --filter @music-frontend/music typecheck`
- `pnpm --filter @music-frontend/music lint`

## Phase 1: API Adapter, Ingestion, And Job Monitoring

**Goal**: make the operator able to submit and track work quickly.

### Phase 1 Expected Changes

- Create `useMusicApi` as the single HTTP adapter.
- Create ingestion pages for URL and upload submission.
- Create a jobs page or dashboard panel for ingestion state tracking using `GET /api/v1/music/ingestions` as the canonical list and summary-count source.
- Implement polling helpers and notifications.
- Add normalized error handling for backend validation and operational failures.

### Phase 1 Validation

- Component tests for ingestion form validation and submission states.
- Store or composable tests for polling and retry behavior.
- Manual test against mocked or real job state transitions.

## Phase 2: Title Auto-Completion And Similar Discovery

**Goal**: deliver the discovery loop that differentiates the product from plain ingestion.

### Phase 2 Expected Changes

- Create a reusable discovery input with auto-completion and debounce.
- Create a similar-results view with mode choice and provider indication, with Last.fm backing the `catalog` mode in the MVP.
- Build reusable selection state for shortlist results.
- Let an auto-complete suggestion prefill a similar-search request or ingestion flow.
- Normalize `providerUsed` and confidence display without exposing backend internals.

### Phase 2 Validation

- Component tests for auto-complete states: too short, empty, success, error.
- Adapter tests proving normalized shape across `LLM` and `catalog` responses.
- Manual test for selecting a suggestion, running discovery, and creating a batch.

## Phase 3: Organization Dry-Run And Apply Flow

**Goal**: make destructive actions safe and legible.

### Phase 3 Expected Changes

- Build organization form with rule selection.
- Build dry-run summary and conflict display.
- Require explicit confirmation before apply.
- Reflect the `move + skip` backend default in UI copy and summaries.

### Phase 3 Validation

- Component tests for dry-run result rendering and confirmation gating.
- Manual test for dry-run followed by execution.
- Accessibility test for keyboard path through the confirmation flow.

## Phase 4: Dashboard, Hardening, And Release Proof

**Goal**: close the operator experience with responsive and accessible polish.

### Phase 4 Expected Changes

- Build the control-center dashboard with recent activity and KPI cards.
- Improve mobile layout and keyboard navigation across all major flows.
- Add failure-state guidance, empty states, provider transparency, and contrast-safe critical actions.
- Finalize app-local testing setup and regression coverage on core composables and stores.

### Phase 4 Validation

- `pnpm --filter @music-frontend/music test`
- Build, typecheck, and lint all pass.
- Manual responsive check on desktop and mobile widths.
- Keyboard-only walkthrough of ingestion, auto-complete, discovery, batch submission, and organization apply.
- Manual check that critical actions show visible feedback immediately and maintain sufficient contrast in loading, error, and confirmation states.

## Validation Strategy

### Primary Commands To Add Or Use

```bash
pnpm --filter @music-frontend/music build
pnpm --filter @music-frontend/music typecheck
pnpm --filter @music-frontend/music lint
pnpm --filter @music-frontend/music test
```

### Focused Test Areas

1. `useMusicApi` response normalization.
2. Polling and state refresh behavior.
3. Auto-complete debounce and empty-state behavior.
4. Similar discovery selection and batch submission state.
5. Organization dry-run confirmation safety.
6. Immediate action feedback and contrast on critical states.

### Manual Validation

1. Submit a URL and verify the created job appears.
2. Submit a file upload and verify immediate feedback.
3. Type a partial title and confirm useful suggestions appear.
4. Run similar discovery in both modes and verify provider visibility.
5. Create a batch from selected results and verify jobs appear.
6. Run a dry-run, inspect conflicts, then confirm apply.
7. Verify the main submit, retry, and confirmation actions react immediately and remain readable in loading and error states.

## Rollout And Operational Risk

1. Backend contracts may still move while the new app is being built.
   - Mitigation: keep typed fixtures and mocked adapters for early frontend work.
2. The UI could accidentally become provider-specific.
   - Mitigation: keep provider logic in normalized view models and shared discovery components.
3. Organization results may be too verbose on mobile.
   - Mitigation: design summary-first cards and collapsible details.
4. Long-running jobs may create stale or confusing UI states.
   - Mitigation: centralize polling, explicit timestamps, and visible retry controls.

## Complexity Tracking

1. New app versus reusing `apps/trader`
   - Chosen approach: new app, because the domain, navigation, and contracts differ too much.
2. Provider selection visibility
   - Chosen approach: allow the UI to display provider provenance and mode, but do not make it depend on provider-specific behavior.
3. Shared code extraction
   - Chosen approach: start app-local and extract to `libs/` only after real reuse is proven.
4. SSE versus polling
   - Chosen approach: plan around polling first, because the spec only requires observable async states, not real-time transport.

## Definition Of Done

- [ ] `apps/music` exists and builds cleanly.
- [ ] Root scripts exist for the new app.
- [ ] URL ingestion, upload, and job monitoring flows are implemented.
- [ ] Title auto-complete returns usable, selectable suggestions.
- [ ] Similar discovery works in `LLM` and `catalog` modes against the same normalized UI model, with Last.fm as the `catalog` provider for the MVP.
- [ ] Batch submission from discovery results works end to end.
- [ ] Organization dry-run and apply flows are implemented safely.
- [ ] Responsive and keyboard-accessible behavior is validated on core workflows.
- [ ] App-local tests cover adapters, polling, discovery, and organization confirmation.
