# Implementation Plan: Trader Frontend

**Branch**: `feat/001-trader-frontend` | **Date**: 2026-05-17 | **Spec**: [spec.md](spec.md)

---

## Summary

Release 001 delivers the full `001-trader-frontend` scope in one release, covering the three capability groups already defined in the spec: `P1`, `P2`, and `P3`. These groups remain useful for sequencing and risk reduction, but they are internal implementation tracks, not separate release promises.

The work is frontend-primary in [apps/trader](/Users/demax/Documents/dev/breexio/frontend-apps-lab/apps/trader), with explicit paired dependency on [apps/trader](/Users/demax/Documents/dev/breexio/nestjs-apps-lab/apps/trader) in the backend whenever the existing API surface is insufficient for Release 001. The main planning conclusion is that the frontend can start immediately on foundation and read surfaces, but Release 001 is contract-blocked on three backend gaps: backtest history listing, signal-correlation read model, and audit-log read model.

Recommended execution order:

1. Lock contracts and frontend foundation.
2. Implement existing read surfaces on top of current backend endpoints.
3. Implement protected mutations and auth/rate-limit handling.
4. Close missing backend contracts required by the spec.
5. Harden, validate, and ship Release 001 as one bundle.

No external research is necessary at this stage. The repo already contains enough concrete API controllers, DTOs, entities, and validation patterns to produce a grounded implementation plan.

---

## Technical Context

**Primary frontend app**: [apps/trader](/Users/demax/Documents/dev/breexio/frontend-apps-lab/apps/trader)  
**Paired backend app**: [apps/trader](/Users/demax/Documents/dev/breexio/nestjs-apps-lab/apps/trader)  
**Frontend stack**: Nuxt 3, Vue 3, TypeScript, Vuetify, Pinia  
**Backend stack already present**: NestJS 11, TypeORM, class-validator, BullMQ, guarded REST controllers  
**Current frontend scaffold state**: Nuxt app exists, but no domain pages, no composables, no stores, no API adapter, no test runner setup in the app package  
**Validation commands currently available**:

- Frontend root: `pnpm lint`, `pnpm typecheck`, `pnpm build`
- Frontend app: `pnpm --filter @trader-frontend/trader dev`, `pnpm --filter @trader-frontend/trader build`, `pnpm --filter @trader-frontend/trader typecheck`
- Backend trader: `pnpm trader:test`, `pnpm trader:build`, `pnpm trader:lint`

**Auth and access context discovered in backend**:

- Trader REST controllers are guarded by `CombinedAuth`, which combines `RateLimitGuard` and `CombinedAuthGuard`.
- Frontend must therefore treat `401`, `403`, and `429` as first-class operator flows, not generic error states.

**Constitution source**:

- No local constitution file exists in `frontend-apps-lab`.
- This plan applies the gates from [nestjs-apps-lab/.specify/memory/constitution.md](/Users/demax/Documents/dev/breexio/nestjs-apps-lab/.specify/memory/constitution.md) because Release 001 is coupled to the NestJS trader backend and the workflow explicitly requires those gates.

---

## Constitution Alignment

| Constitution Principle | Plan Alignment |
|---|---|
| Explicit application boundaries | Frontend work stays app-local in `apps/trader`; reusable UI or API helpers move to `libs/` only after proven reuse. Backend gaps are handled as explicit paired changes in the trader app, not through hidden client-side workarounds. |
| Contracts and inputs validated | Frontend will type every backend response behind an adapter layer and mirror backend DTO requirements for `backtest launch`, `kill-switch`, `resume`, and `weight profile update`. Protected routes, auth assumptions, and rate-limit handling are documented in this plan. |
| External integrations isolated and safe | The frontend talks only to the trader backend, never directly to exchange or risk systems. Risky actions such as `kill-switch`, `resume`, and config updates stay behind dedicated action composables and confirmed UI flows. |
| Async workloads observable and idempotent | Polling, backtest launch/status refresh, and long-running backtest monitoring will expose visible loading, stale, retry, and failure states. Backtest launch polling is designed to be repeatable without duplicating the underlying run. |
| Quality gates match experiment risk | Read-only slices get focused component and adapter validation. Mutation and money-adjacent slices require stronger checks: backend DTO validation, focused tests, and documented manual verification in paper or staging mode. |
| Spec-driven delivery | This plan is derived from [spec.md](spec.md), keeps the clarified release scope, and requires [tasks.md](/Users/demax/Documents/dev/breexio/frontend-apps-lab/specs/001-trader-frontend/tasks.md) to be synchronized after the plan update. |

---

## Directories And Files Likely To Change

### Frontend Repo: Primary Change Surface

- [package.json](/Users/demax/Documents/dev/breexio/frontend-apps-lab/package.json)
- [apps/trader/package.json](/Users/demax/Documents/dev/breexio/frontend-apps-lab/apps/trader/package.json)
- [apps/trader/nuxt.config.ts](/Users/demax/Documents/dev/breexio/frontend-apps-lab/apps/trader/nuxt.config.ts)
- [apps/trader/src/app.vue](/Users/demax/Documents/dev/breexio/frontend-apps-lab/apps/trader/src/app.vue)
- `apps/trader/src/layouts/default.vue`
- `apps/trader/src/pages/index.vue`
- `apps/trader/src/pages/watchlist.vue`
- `apps/trader/src/pages/signals.vue`
- `apps/trader/src/pages/positions.vue`
- `apps/trader/src/pages/trades.vue`
- `apps/trader/src/pages/backtest/index.vue`
- `apps/trader/src/pages/backtest/[runId].vue` or existing `results-[id].vue`
- `apps/trader/src/pages/config.vue`
- `apps/trader/src/pages/correlation.vue`
- `apps/trader/src/components/**`
- `apps/trader/src/composables/useTraderApi.ts`
- `apps/trader/src/composables/usePolling.ts`
- `apps/trader/src/composables/usePermissions.ts`
- `apps/trader/src/composables/useSession.ts` or equivalent auth helper
- `apps/trader/src/stores/trader.ts`
- `apps/trader/src/stores/ui.ts`
- `apps/trader/src/stores/cache.ts`
- `apps/trader/src/utils/formatters.ts`
- `apps/trader/src/utils/validators.ts`
- `apps/trader/src/utils/constants.ts`
- `apps/trader/src/types/**`
- `apps/trader/test/**` or colocated `*.spec.ts` once Vitest is added
- [specs/001-trader-frontend/plan.md](/Users/demax/Documents/dev/breexio/frontend-apps-lab/specs/001-trader-frontend/plan.md)
- [specs/001-trader-frontend/tasks.md](/Users/demax/Documents/dev/breexio/frontend-apps-lab/specs/001-trader-frontend/tasks.md)

### Backend Repo: Secondary Change Surface If Contract Gaps Are Closed

- [apps/trader/src/api/controllers/backtest.controller.ts](/Users/demax/Documents/dev/breexio/nestjs-apps-lab/apps/trader/src/api/controllers/backtest.controller.ts)
- [apps/trader/src/api/controllers/signals.controller.ts](/Users/demax/Documents/dev/breexio/nestjs-apps-lab/apps/trader/src/api/controllers/signals.controller.ts)
- [apps/trader/src/api/controllers/config.controller.ts](/Users/demax/Documents/dev/breexio/nestjs-apps-lab/apps/trader/src/api/controllers/config.controller.ts)
- New or extended controller for audit-log read access under `apps/trader/src/api/controllers/`
- New DTOs under `apps/trader/src/api/dto/`
- Optional read-model services under `apps/trader/src/api/` or domain modules if pagination totals, correlation summaries, or audit projections are added

---

## Research Findings

1. The backend already exposes most of the Release 001 operational surface as guarded REST endpoints under `api/v1`: status, watchlist, signals, positions, trades, config, control, and backtest launch/detail.
2. The frontend spec and the backend contract are not fully aligned. The current backend lacks a backtest history listing endpoint, a signal-correlation endpoint, and an audit-log read endpoint, all of which are required by Release 001.
3. Config mutation is narrower than the spec wording suggests. The backend exposes `PUT /api/v1/config/weights`, not a generic config mutation surface, and it requires `actor`, optional `reason`, `weights`, and `thresholds`.
4. Trader API controllers already validate inputs with `ValidationPipe` and DTOs. That reduces ambiguity for launch, pagination, kill-switch, resume, and weight profile update payloads.
5. Several backend entities use database numeric columns that will reach the frontend as strings. The frontend must normalize these values in a single adapter layer instead of spreading parsing across components.
6. Trades currently return an array using offset/limit query params but no explicit `total` count. Classic paginated tables are possible only if the backend adds a total count or the frontend chooses a simpler load-more strategy.
7. Signal staleness is already exposed indirectly. The signals controller returns `missingRequiredSignals` and `staleSignals`, so the frontend can implement stale and blocked signal UX without waiting for a new endpoint.
8. Audit information is partially present in the backend today through `NotificationEvent` records written during weight profile updates, but there is no dedicated read API yet.

---

## Contracts And Data Model Notes

| Surface | Current Backend Contract | Frontend Handling | Gap / Decision |
|---|---|---|---|
| Status | `GET /api/v1/status` returns `SpotStatusDto` with `tradingMode`, capability flags, `watchlistSize`, `holdingsCount`, `killSwitchActive`, `timestamp` | Use directly for top-level dashboard summary and release readiness badges | No gap |
| Watchlist | `GET /api/v1/watchlist` returns `WatchlistAsset[]` with `symbol`, `marketScope`, `rankScore`, `sectorBucket`, `filterResults`, `scoringMetadata`, timestamps | Normalize `rankScore` and derive filter chips locally | No gap |
| Signals | `GET /api/v1/signals` and `GET /api/v1/signals/:symbol` return aggregated signal views with `compositeScore`, `confidence`, `contributions`, `missingRequiredSignals`, `staleSignals`, `timestamp` | Power dashboard heatmap and signal detail views from a typed adapter | No gap for current signal views |
| Positions | `GET /api/v1/positions` returns `Position[]` with numeric strings and timestamps | Normalize price and PnL fields centrally before rendering | No gap |
| Trades | `GET /api/v1/trades?offset&limit` validates `offset` and `limit` via DTO and returns `Trade[]` | Use offset/limit adapter and expose server-side pagination state | Backend should add `total` for exact paginated tables, or frontend should switch to load-more |
| Backtest launch | `POST /api/v1/backtest/launch` accepts `symbols`, optional `days`, `timeframe`, `startDate`, `endDate`, `marketScope`, `profileName`; returns `{ runId }` | Frontend form must respect DTO constraints and poll run detail after launch | No gap for launch |
| Backtest detail | `GET /api/v1/backtest/:runId` returns `BacktestRun` with `status`, `params`, `metrics`, `equityCurve`, `trades`, timestamps | Use for run detail and progress polling | Missing list/history endpoint for backtest history screen |
| Config read | `GET /api/v1/config` returns active `WeightProfile` | Feed config screen defaults and version badge | No gap |
| Config write | `PUT /api/v1/config/weights` accepts `actor`, optional `reason`, `weights`, `thresholds`; backend validates weights sum to one and writes a notification event | Frontend must collect actor and reason explicitly, map `422` validation errors inline, and treat update as versioned config replacement | Spec wording should stay broader, but implementation must follow current route and payload |
| Control actions | `POST /api/v1/control/kill-switch` and `POST /api/v1/control/resume` require `actor` and `reason` and return `{ ok: true }` | Guard with confirmation dialogs and disabled states, then refetch status | No gap |
| Correlation | No current endpoint found | Do not synthesize this from raw UI state | Backend addition required for Release 001 |
| Audit log | No read endpoint found; config updates currently emit `NotificationEvent` records | Frontend should consume an explicit audit read model instead of reverse-engineering notifications | Backend addition required for Release 001 |

**Data normalization notes**:

- `rankScore`, `quantity`, `entryPrice`, `markPrice`, `unrealizedPnl`, `realizedPnl`, `fees`, and `funding` must be normalized from strings to typed frontend view models.
- Backtest `metrics`, `equityCurve`, and `trades` are JSON blobs; the frontend should wrap them in typed translators before charting or table rendering.
- Backend uses market-scope filtering internally. Release 001 should assume `spot` only and keep that assumption explicit in the frontend adapter layer.

---

## Implementation Sequence And Milestones

These are internal sequencing checkpoints inside the same release, not separate release commitments.

| Sequence | Goal | Scope | Dependencies | Success Signal |
|---|---|---|---|---|
| 0. Contract Lock And Foundation | Create the frontend runtime skeleton and freeze the Release 001 contract map | Pinia, Vuetify plugin setup, typed API client, auth/error/rate-limit handling, numeric normalization, test runner setup | Current frontend scaffold | Backend routes mapped, adapter layer exists, mock fixtures prepared for missing endpoints |
| 1. Read Surfaces On Existing Contracts | Ship all read-only views that current backend already supports | Dashboard, watchlist, signals, positions, trades, backtest launch + run detail | Sequence 0 | Operator can browse core read surfaces against live backend without mutation actions |
| 2. Protected Mutations And Safety UX | Add guarded actions on top of validated DTO-backed endpoints | Kill-switch, resume, weight profile update, validation error mapping, success/failure toasts, stale/refetch logic | Sequences 0 and 1 | Mutation UX behaves correctly in paper or staging mode and refetches state safely |
| 3. Release 001 Contract Gap Closure | Close spec-vs-backend gaps that block full release | Backtest history endpoint, correlation endpoint, audit-log endpoint, optional trade total count | Can run in parallel with Sequences 1 and 2, but required before release exit | Frontend screens for backtest history, correlation, and audit log stop relying on mock data |
| 4. Hardening And Release Proof | Consolidate performance, security, and validation evidence | 401/403/429 handling, polling backoff, regression tests, manual operator checklist, docs sync | Sequences 1 to 3 | Release 001 exit criteria all satisfied with reproducible evidence |

### Internal Checkpoints

**Checkpoint A: Foundation Ready**

- Adapter layer wraps every backend endpoint used by Release 001.
- Numeric normalization is centralized and covered by tests.
- Mock handlers exist for missing backend endpoints so frontend work can proceed without blocking.

**Checkpoint B: Protected Flows Ready**

- `kill-switch`, `resume`, `backtest launch`, and `config update` are wired to validated DTO payloads.
- 401, 403, 422, and 429 responses produce intentional UX, not generic crash states.
- No mutation action remains callable without actor and reason where backend requires them.

**Checkpoint C: Release 001 Exit**

- Current backend gaps are closed or explicitly approved via spec change.
- Read, mutation, analytics, and audit flows all run against real endpoints.
- Validation evidence is captured for both frontend and any paired backend contract change.

---

## Validation Strategy

### Frontend Validation

- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter @trader-frontend/trader build`
- Add and run app-local tests with Vitest once the app test setup exists: `pnpm --filter @trader-frontend/trader test`

### Backend Validation If Contract Gaps Are Closed

- `pnpm trader:test`
- `pnpm trader:build`
- Focused controller/service tests for any new `backtest list`, `correlation`, `audit log`, or pagination-total behavior

### Manual Validation

1. Open dashboard and confirm status, watchlist size, holdings count, and kill-switch state match backend data.
2. Open watchlist and signals screens and verify stale/missing signal states surface correctly.
3. Open positions and trades screens and confirm numeric values are rendered correctly after normalization.
4. Launch a backtest, poll run status, and verify run detail renders `metrics`, `equityCurve`, and `trades` correctly.
5. Execute `kill-switch` and `resume` in a safe environment and confirm confirmation UX, success state, and status refetch.
6. Update weights with `actor` and `reason`, confirm inline validation on invalid payloads, and verify versioned config readback.
7. Exercise expired-auth, forbidden, and rate-limited responses to confirm 401, 403, and 429 UX.
8. Verify correlation and audit-log screens against real backend data once those endpoints exist.

### Validation Evidence Requirement

This is non-trivial work under the constitution. The plan therefore requires reproducible evidence for each risky slice:

- focused tests for adapter and mutation logic
- build/typecheck proof for frontend
- backend tests if API contracts are added or changed
- a short manual checklist result for kill-switch, config update, and backtest flows

---

## Rollout And Operational Risk

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Missing backend endpoints for history, correlation, or audit log delay release completion | Release 001 scope cannot be fully delivered | High | Treat these as explicit paired backend tasks from the start and keep frontend on mocks only temporarily |
| Numeric string handling leaks into components and causes formatting or sorting defects | Incorrect PnL, score, and ranking displays | High | Centralize parsing in the API adapter and test it directly |
| Rate limiting or auth failures create noisy operator UX | Broken trust in control surfaces | Medium | Design dedicated 401/403/429 handling in the API layer and disable repeated action spam |
| Kill-switch or resume requests are triggered without enough operator context | Unsafe production behavior | Medium | Force actor and reason entry, show confirmation dialogs, and keep actions environment-gated in manual validation |
| Trades pagination lacks a total count | UI pagination design becomes misleading | Medium | Either add a total in backend or switch the UI to load-more / incremental fetch for Release 001 |
| Correlation view is built client-side from incomplete data | Wrong trading conclusions | Medium | Require a backend read model rather than synthesizing correlation in-browser |

---

## Complexity Tracking

1. **Release scope vs execution order**: The clarified spec requires one release containing `P1 + P2 + P3`, but shipping everything in one blast would raise risk. This plan keeps internal sequences and checkpoints while making it explicit that those are not separate release promises.
2. **Contract gap handling**: The simplest-looking shortcut would be to fake correlation, audit history, or backtest history in the browser from whatever raw data exists. The plan rejects that shortcut and instead prefers explicit backend read models because they are safer, more testable, and closer to the constitution.
3. **Pagination model**: The spec implies classical paginated trade tables, but the current backend returns an array without `total`. The plan leaves one controlled decision point: add backend total count or consciously downgrade the UI to load-more for Release 001.
4. **Auth model uncertainty**: Controllers are protected, but the frontend repo has no auth/session abstraction yet. The plan therefore includes an early auth shell instead of letting each screen guess how credentials, 401 retries, and rate-limit messaging should behave.

---

## Definition Of Done

- [ ] Release 001 still maps to the clarified spec scope: `P1 + P2 + P3` in one release
- [ ] All frontend views and protected actions required by [spec.md](spec.md) are implemented against real endpoints
- [ ] Backend gaps for backtest history, correlation, and audit log are closed or the spec is explicitly changed
- [ ] Frontend lint, typecheck, and build pass
- [ ] Focused frontend tests exist for adapters, polling, mutation flows, and numeric normalization
- [ ] Any paired backend contract change has focused tests and build validation
- [ ] Manual validation evidence exists for dashboard, backtest, kill-switch, resume, config update, and auth/rate-limit handling
- [ ] [tasks.md](/Users/demax/Documents/dev/breexio/frontend-apps-lab/specs/001-trader-frontend/tasks.md) is regenerated or updated to match this plan
