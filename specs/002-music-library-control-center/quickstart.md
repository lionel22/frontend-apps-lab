# Quickstart: Music Library Control Center Frontend

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Tasks**: [tasks.md](./tasks.md) | **System Design**: [system-design.md](./system-design.md)

## What This Feature Delivers

This frontend feature creates a dedicated `apps/music` Nuxt app that lets an operator:

1. submit URL and upload ingestions
2. monitor jobs from a canonical jobs list
3. search titles with auto-completion
4. run similar discovery in `LLM` and `catalog` modes
5. submit batch ingestion from shortlisted results
6. preview and apply organization rules safely
7. view simple KPI cards and recent activity from the same shared state

## Read Order

1. Read [spec.md](./spec.md) for the product scope and frozen contracts.
2. Read [plan.md](./plan.md) for phase order and validation gates.
3. Read [system-design.md](./system-design.md) for normalized payload shapes and route responsibilities.
4. Read [tasks.md](./tasks.md) for the implementation sequence.

## Frozen MVP Decisions

1. `GET /api/v1/music/ingestions` is the canonical read surface for jobs and dashboard KPI derivation.
2. Async refresh is polling-only for MVP.
3. Auto-complete suggestions expose a stable reusable `reference` payload.
4. Organization dry-run normalizes to `summary`, `plannedMoves`, `skippedConflicts`, and `ignoredItems`.
5. Provider failures stay explicit with retry or manual mode switch; the UI performs no automatic fallback.
6. Upload-limit copy defaults to 100 MB until a richer capability contract exists.
7. If auth is required, the app prompts once for the shared operator bearer token and re-prompts on `401`.
8. Organization apply reuses `POST /api/v1/music/organize` with `dryRun=false` and expects a stable summary-plus-details response.

## First Safe Implementation Slice

Start here if you are opening `/workflows:work` on this package:

1. `T001` to `T007` for app bootstrap, runtime config, typed models, API adapter, and shared shell.
2. `T008` to `T013` for URL or upload ingestion and jobs monitoring.
3. `T014` to `T019` for discovery and batch submission.

Do not build dashboard-only or organization polish first; the ingestion and jobs loop is the product backbone.

## Validation Commands

```bash
pnpm --filter @music-frontend/music build
pnpm --filter @music-frontend/music typecheck
pnpm --filter @music-frontend/music lint
pnpm --filter @music-frontend/music test
```

## Manual Proof Once The App Exists

1. Submit one URL and one upload and confirm jobs appear.
2. Filter jobs, refresh manually, and verify polling updates.
3. Run title auto-completion and reuse a suggestion.
4. Run similar discovery in both modes and verify provider visibility.
5. Submit a batch and confirm created jobs are trackable.
6. Run dry-run, inspect conflicts, then confirm apply.
7. Verify auth-required entry or `401` recovery if auth is enabled.
8. Verify immediate button feedback, keyboard traversal, and readable critical states.

## Implementation Notes

1. Keep backend contract normalization in `useMusicApi` and workflow composables.
2. Keep KPI cards derived from the canonical jobs list contract.
3. Prefer summary-first rendering for verbose organization results.
4. Preserve operator input when provider or backend failures occur.
