---
description: 'Task list for Music Library Control Center Frontend (002-music-library-control-center)'
---

# Tasks: Music Library Control Center Frontend

**Input**: spec.md, plan.md
**Branch**: `002-music-library-control-center`
**Scope**: MVP delivery for `apps/music` covering ingestion, discovery, organization, jobs monitoring, and the operator dashboard
**Organization**: Tasks grouped by implementation sequence. `[P]` marks tasks that can run in parallel. `[US#]` maps to independently testable user stories.

---

## Sequence 0: App Bootstrap And Operator Shell

**Goal**: create the new Nuxt app, runtime config, shell, and shared frontend foundation for all later workflows.

- [ ] T001 [P] Scaffold the new app package in `apps/music/{package.json,nuxt.config.ts,tsconfig.json,vitest.config.ts,Dockerfile}` and add root `package.json` scripts for `music:dev`, `music:build`, `music:typecheck`, `music:lint`, and `music:test` | **Effort**: medium (1d) | **Depends on**: none | **Validation**: workspace filters and root scripts resolve `@music-frontend/music` cleanly
- [ ] T002 [P] Create the base source tree in `apps/music/src/{app.vue,assets/global.css,layouts/default.vue,pages,components,composables,stores,types,utils,test}` using the trader app structure as the template | **Effort**: small (1d) | **Depends on**: T001 | **Validation**: Nuxt recognizes `srcDir` and boots into the default layout with placeholder routes
- [ ] T003 Configure Vuetify, Pinia, and runtime config in `apps/music/nuxt.config.ts` and the required app plugins so `NUXT_PUBLIC_MUSIC_API_URL`, polling defaults, and auth flags are centralized | **Effort**: small (1d) | **Depends on**: T001 | **Validation**: runtime config values are readable from the shell without any hard-coded API base URL
- [ ] T004 [P] Create shared music view models and helpers in `apps/music/src/types/music.ts` and `apps/music/src/utils/{constants,formatters}.ts` for ingestion jobs, autocomplete suggestions, similar results, organization dry runs, and batch submissions | **Effort**: medium (1d) | **Depends on**: T001 | **Validation**: all feature slices import one normalized frontend shape instead of per-component payload typing
- [ ] T005 Implement the typed API adapter in `apps/music/src/composables/useMusicApi.ts` for ingestions, uploads, jobs, autocomplete, similar search, batch submission, and organization requests with structured error mapping | **Effort**: medium (2d) | **Depends on**: T003, T004 | **Validation**: mocked calls cover happy-path and failure-path normalization for every backend surface
- [ ] T006 [P] Add shared UI primitives in `apps/music/src/components/shared/` for loading, error, empty, success, notifications, confirmation dialogs, and section headers | **Effort**: medium (1d) | **Depends on**: T002 | **Validation**: placeholder pages can swap among loading, error, empty, and success using shared components only
- [ ] T007 Create cross-cutting composables and stores in `apps/music/src/composables/{usePolling,useNotifications,useSelection}.ts` and `apps/music/src/stores/{music,ui}.ts` for polling, operator feedback, cache invalidation, and shortlist selection | **Effort**: medium (1d) | **Depends on**: T004, T005 | **Validation**: polling, notification, and selection logic can run independently of any specific page

---

## Sequence 1: Ingestion And Job Monitoring

**Goal**: deliver the core operator loop for submitting music sources and tracking their status end to end.

- [ ] T008 [US1] Create the ingestion workflow layer in `apps/music/src/composables/useIngestionActions.ts` and `apps/music/src/stores/music.ts` to centralize URL and upload submission, pending state, success toasts, and list invalidation | **Effort**: medium (1d) | **Depends on**: T005, T007 | **Validation**: URL and upload mutations share one source of truth for pending, success, and error state
- [ ] T009 [US1] Build the URL ingestion surface in `apps/music/src/components/ingestion/UrlIngestionForm.vue` and `apps/music/src/pages/ingestion.vue` with URL validation, disabled/loading states, and post-submit reset rules | **Effort**: medium (1d) | **Depends on**: T006, T008 | **Validation**: a valid URL enqueues exactly once and invalid input is blocked or mapped to actionable API feedback
- [ ] T010 [US1] Build the upload surface in `apps/music/src/components/ingestion/FileUploadForm.vue` and wire file limit, extension, and submission feedback handling into `apps/music/src/pages/ingestion.vue` | **Effort**: medium (1d) | **Depends on**: T006, T008 | **Validation**: accepted files submit with visible feedback and rejected files surface a clear client or server reason
- [ ] T011 [US1] Build jobs monitoring in `apps/music/src/components/jobs/{JobsToolbar.vue,JobsList.vue,JobStatusChip.vue}` and `apps/music/src/pages/jobs.vue` with status, timestamps, source, job ID, and last update | **Effort**: medium (2d) | **Depends on**: T005, T006, T007 | **Validation**: a created job is visible with status, source, ID, and last update without a full page reload
- [ ] T012 [US1] Add status filters, manual refresh, and lightweight auto-refresh controls in `apps/music/src/composables/useJobPolling.ts` and `apps/music/src/components/jobs/JobsToolbar.vue` with persisted operator preferences | **Effort**: medium (1d) | **Depends on**: T007, T011 | **Validation**: filters survive refresh and auto-refresh stays understandable and operator-controlled
- [ ] T013 [US1] Wire failure details, empty states, and traceability from submission results into `apps/music/src/pages/{ingestion,jobs}.vue` so every created job can be followed from the UI | **Effort**: medium (1d) | **Depends on**: T009, T010, T011, T012 | **Validation**: failed jobs show actionable copy and new submissions deep-link back into monitoring

---

## Sequence 2: Title Search, Similar Discovery, And Batch Ingestion

**Goal**: deliver the discovery loop for finding known tracks, exploring similar results, and sending selections into ingestion.

- [ ] T014 [US2] Build the title autocomplete input and suggestion list in `apps/music/src/components/discovery/{TitleAutocomplete.vue,AutocompleteSuggestionList.vue}` with debounce, min-length gating, metadata display, and keyboard navigation | **Effort**: medium (2d) | **Depends on**: T005, T006 | **Validation**: too-short, empty, no-result, and success states are visually distinct and keyboard navigable
- [ ] T015 [US2] Reuse selected suggestions inside `apps/music/src/pages/{ingestion,discovery}.vue` so a picked title can prefill ingestion or seed a similar-search request without local shape conversion | **Effort**: small (1d) | **Depends on**: T009, T014 | **Validation**: selecting a suggestion carries title, artist, and reference data into downstream flows without retyping
- [ ] T016 [US4] Implement `apps/music/src/composables/useSimilarDiscovery.ts` to normalize `LLM` and `catalog` responses, preserve provider provenance, and map provider-unavailable failures into controlled UI states | **Effort**: medium (1d) | **Depends on**: T004, T005 | **Validation**: `LLM` and `catalog` responses normalize into one shortlist contract and preserve `providerUsed`
- [ ] T017 [US4] Build the similar-search form and page flow in `apps/music/src/components/discovery/SimilarSearchForm.vue` and `apps/music/src/pages/discovery.vue` with mode switch, explicit provider visibility, and shared loading, error, and empty handling | **Effort**: medium (1d) | **Depends on**: T006, T014, T016 | **Validation**: switching modes reruns the same workflow and always exposes the active provider to the operator
- [ ] T018 [US4] Build shortlist result components in `apps/music/src/components/discovery/{SimilarResultsList.vue,SimilarResultCard.vue,SelectionBar.vue}` with stable multi-select, metadata display, and selection summary | **Effort**: medium (1d) | **Depends on**: T007, T017 | **Validation**: multi-select remains stable through result refreshes or mode changes until the operator resets it
- [ ] T019 [US4] Implement batch ingestion submission from discovery results in `apps/music/src/composables/useBatchIngestion.ts` and `apps/music/src/pages/discovery.vue` with created job IDs, partial-failure handling, and handoff into `apps/music/src/pages/jobs.vue` | **Effort**: medium (2d) | **Depends on**: T011, T017, T018 | **Validation**: selected results create trackable jobs and partial failures do not discard successful items

---

## Sequence 3: Organization Dry-Run And Apply Safety

**Goal**: make library organization safe, legible, and impossible to apply accidentally.

- [ ] T020 [US3] Build the organization form in `apps/music/src/components/organize/OrganizationRuleForm.vue` and `apps/music/src/pages/organize.vue` with simple rule inputs, safe defaults, and copy tied to Navidrome-targeted library organization | **Effort**: medium (1d) | **Depends on**: T005, T006 | **Validation**: rule inputs stay minimal and explain the intended library outcome clearly before any API call
- [ ] T021 [US3] Implement the dry-run workflow in `apps/music/src/composables/useOrganizationWorkflow.ts` and normalize diff payloads in `apps/music/src/types/music.ts` into summary, planned moves, conflicts, and ignored items | **Effort**: medium (2d) | **Depends on**: T004, T005, T020 | **Validation**: dry-run returns a readable summary without mutating the library
- [ ] T022 [US3] Render dry-run results in `apps/music/src/components/organize/{DryRunSummary.vue,DryRunDiffList.vue}` with summary-first cards and collapsible details for large diffs | **Effort**: medium (1d) | **Depends on**: T006, T021 | **Validation**: large dry-run diffs remain scannable on desktop and mobile through summary-first presentation
- [ ] T023 [US3] Add explicit confirmation gating in `apps/music/src/components/organize/ApplyOrganizationDialog.vue` so apply is blocked until a successful reviewed dry run exists | **Effort**: small (1d) | **Depends on**: T006, T022 | **Validation**: the real apply action stays disabled until the operator reviews a successful dry-run snapshot
- [ ] T024 [US3] Render apply results, ignored and conflict follow-up, and retry and reset behavior in `apps/music/src/pages/organize.vue` using the shared organization workflow store | **Effort**: medium (1d) | **Depends on**: T021, T023 | **Validation**: apply results show successes, skipped items, conflicts, and next actions in one place

---

## Sequence 4: Dashboard And Cross-Cutting Operator UX

**Goal**: close the MVP with a readable control center, consistent states, and responsive accessible behavior.

- [ ] T025 [US5] Build the control-center dashboard in `apps/music/src/pages/index.vue` and `apps/music/src/components/dashboard/` with KPI cards for active jobs, recent failures, recent operations, and discovery-to-ingestion activity | **Effort**: medium (2d) | **Depends on**: T006, T007, T011, T019, T024 | **Validation**: dashboard KPIs and recent activity derive from shared live state instead of page-specific one-off fetch logic
- [ ] T026 [US5] Unify loading, error, empty, and success handling across `apps/music/src/pages/{index,ingestion,jobs,discovery,organize}.vue` and shared state helpers with clear retry affordances | **Effort**: medium (1d) | **Depends on**: T013, T017, T024, T025 | **Validation**: every top-level route exposes explicit state handling and operator-friendly retry copy
- [ ] T027 [US5] Harden responsive layout and keyboard flow in `apps/music/src/layouts/default.vue`, `apps/music/src/assets/global.css`, and critical action components for desktop and mobile parity | **Effort**: medium (1d) | **Depends on**: T009, T011, T017, T022, T025 | **Validation**: keyboard-only traversal covers ingestion, discovery, batch submission, and organization confirmation across breakpoints
- [ ] T028 [US5] Finalize operator copy, mode and provider transparency, and degraded-backend guidance across discovery, jobs, dashboard, and organization screens | **Effort**: small (1d) | **Depends on**: T017, T019, T024, T025 | **Validation**: provider origin, batch outcomes, and degraded backend behavior remain explicit in the UI copy
- [ ] T029 [US5] Finalize navigation and route structure in `apps/music/src/layouts/default.vue` and `apps/music/src/pages/**` so dashboard, ingestion, jobs, discovery, and organization routes preserve active state and mobile usability | **Effort**: small (1d) | **Depends on**: T002, T025, T026, T027 | **Validation**: route transitions preserve context, active navigation state, and mobile usability without dead ends

---

## Sequence 5: Tests, Validation, And Docs Sync

**Goal**: produce enough automated and manual proof to ship the MVP without overbuilding the test surface.

- [ ] T030 [P] Add adapter and unit tests in `apps/music/src/test/api/{useMusicApi.spec.ts,music-models.spec.ts}` for response normalization, error mapping, and provider visibility data | **Effort**: medium (1d) | **Depends on**: T005, T016, T021 | **Validation**: tests prove normalized models across ingestion, autocomplete, similar-search, and organization contracts
- [ ] T031 [P] Add composable and store tests in `apps/music/src/test/composables/{usePolling,useIngestionActions,useSimilarDiscovery,useOrganizationWorkflow}.spec.ts` and `apps/music/src/test/stores/music.spec.ts` for polling, invalidation, selection, and confirmation gating | **Effort**: medium (1d) | **Depends on**: T007, T008, T016, T021 | **Validation**: workflow tests cover polling refresh, shortlist selection, and dry-run/apply state transitions
- [ ] T032 [P] Add component tests in `apps/music/src/test/components/ingestion-and-jobs.spec.ts` for URL submission, upload submission, status filters, and job traceability | **Effort**: medium (1d) | **Depends on**: T009, T010, T011, T012, T013 | **Validation**: component tests prove submission feedback and monitoring behavior on the main ingestion loop
- [ ] T033 [P] Add component tests in `apps/music/src/test/components/{discovery-and-batch.spec.ts,organization.spec.ts}` for autocomplete states, mode switching, batch submission, dry-run rendering, and apply confirmation gating | **Effort**: medium (1d) | **Depends on**: T014, T019, T022, T023, T024 | **Validation**: component tests prove the risky discovery and organization paths without broad end-to-end overhead
- [ ] T034 Run `pnpm --filter @music-frontend/music lint`, `pnpm --filter @music-frontend/music typecheck`, `pnpm --filter @music-frontend/music build`, and `pnpm --filter @music-frontend/music test` and fix only issues inside `apps/music` and root script wiring | **Effort**: small (1d) | **Depends on**: T030, T031, T032, T033 | **Validation**: all app-local quality gates pass from the repo root
- [ ] T035 Execute a manual MVP smoke pass for desktop, mobile, and keyboard-only flows across dashboard, URL ingestion, upload, jobs filtering, autocomplete, similar search in both modes, batch submission, and organization dry-run and apply | **Effort**: small (1d) | **Depends on**: T029, T034 | **Validation**: every acceptance path in `specs/002-music-library-control-center/spec.md` has a reproducible operator smoke check
- [ ] T036 Sync docs in `GETTING-STARTED.md`, `apps/music/README.md`, and `specs/002-music-library-control-center/{plan.md,spec.md}` only where implementation reality or run commands differ from the current documents | **Effort**: small (0.5d) | **Depends on**: T035 | **Validation**: setup, run, and MVP workflow notes match the shipped app and commands exactly

---

## Execution Summary

| Sequence | Tasks | Purpose |
| --- | --- | --- |
| 0 | T001-T007 | App bootstrap, runtime config, typed models, and shared shell |
| 1 | T008-T013 | URL and upload ingestion and jobs monitoring |
| 2 | T014-T019 | Autocomplete, similar discovery, and batch ingestion |
| 3 | T020-T024 | Organization dry-run and safe apply flow |
| 4 | T025-T029 | Dashboard, shared UX states, responsiveness, and navigation |
| 5 | T030-T036 | Tests, validation, smoke proof, and docs sync |

**Estimated effort**: ~26 to 31 days depending on backend contract stability and how much Sequence 5 can overlap with UI finishing work.
**MVP scope**: T001-T029 deliver the operator-facing product; T030-T036 provide the proof, stabilization, and documentation needed to ship it.
**Critical path**: T001 -> T003 -> T004 -> T005 -> T007 -> T008 -> T011 -> T014 -> T016 -> T017 -> T018 -> T019 -> T020 -> T021 -> T022 -> T023 -> T024 -> T025 -> T026 -> T027 -> T029 -> T034 -> T035 -> T036.

---

## Notes For The Team

- Keep backend contract normalization in `useMusicApi.ts` and workflow composables, not inside Vue components.
- Prefer one reusable discovery workflow for autocomplete, similar search, and batch ingestion instead of parallel disconnected implementations.
- If backend contracts move during implementation, update `plan.md` and `spec.md` before spreading workaround logic across pages.
