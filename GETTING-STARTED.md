# Getting Started: Frontend Apps Lab

Welcome to **Frontend Apps Lab**, the monorepo for all frontend applications serving Breexio backend services.

---

## What Is This?

A **pnpm monorepo** containing frontend applications built with Nuxt 3 + Vue 3 + TypeScript + Vuetify, following a **spec-driven development** workflow.

**Current App**:
- **trader**: Frontend for the Breexio trader platform (`apps/trader/`)

**Future Apps**:
- Add more independent apps under `apps/` as needed

---

## Repository Structure

```
frontend-apps-lab/
├── apps/
│   └── trader/                 ← Trader platform frontend (Nuxt 3)
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── stores/
│       │   ├── composables/
│       │   └── ...
│       ├── nuxt.config.ts
│       └── package.json
├── libs/                       ← Shared components & utilities (future)
├── specs/
│   ├── INDEX.md               ← Navigation guide
│   └── 001-trader-frontend/   ← Spec-driven feature folder
│       ├── spec.md            ← Requirements & user stories
│       ├── plan.md            ← Timeline & phases
│       ├── tasks.md           ← Granular task checklist
│       ├── system-design.md   ← Architecture & API contracts
│       └── quickstart.md      ← Getting started guide
├── package.json               ← Root workspace config
├── pnpm-workspace.yaml        ← Monorepo configuration
├── tsconfig.base.json         ← Shared TypeScript config
├── eslint.config.mjs          ← Shared ESLint rules
└── README.md
```

---

## Quick Setup

### 1. Prerequisites

- **Node.js** 18+
- **pnpm** 9.0+
- **Git**

### 2. Install

```bash
cd frontend-apps-lab
pnpm install
```

### 3. Start Dev Server

```bash
cd apps/trader
pnpm dev
# → http://localhost:3000
```

---

## Development Workflow

### Step 1: Understand the Feature

Read the spec docs in order (15 min):

```bash
# Trader frontend feature
cd specs/001-trader-frontend/
cat quickstart.md       # ← Start here
cat spec.md             # ← Understand requirements
cat system-design.md    # ← Understand architecture

# Music control center feature
cd ../002-music-library-control-center/
cat quickstart.md       # ← Start here for feature 002
cat spec.md             # ← Understand requirements
cat system-design.md    # ← Understand frozen API contracts
```

### Step 2: Pick a Task

Open the relevant tasks file for the feature you are implementing and find an unchecked task (`- [ ] T###`):

```bash
# Example from feature 001: T001 — Initialize Nuxt 3 app
- [ ] T001 — Initialize Nuxt 3 app with TypeScript strict mode and Vuetify 3
```

### Step 3: Mark In-Progress

Before you start coding, mark the task as in-progress:

```bash
# In tasks.md, change:
# - [ ] T001 → - [x] T001 (or open tasks.md in editor and check the box)
```

### Step 4: Code

Implement the task following the acceptance criteria. Use the matching feature's `system-design.md` as a reference for architecture patterns.

### Step 5: Validate

Run the checks:

```bash
cd apps/trader

# Type check
pnpm typecheck

# Lint
pnpm lint

# Test (if tests exist)
pnpm test

# Build
pnpm build
```

### Step 6: Mark Complete

Mark the task as done in tasks.md:

```bash
# Change: - [x] T001 (or check the box in editor)
```

### Step 7: Submit PR

Push to a feature branch and open a PR:

```bash
git checkout -b feat/T001-init-nuxt3
git add .
git commit -m "T001: Initialize Nuxt 3 app with strict mode and Vuetify"
git push origin feat/T001-init-nuxt3
```

**PR Description Template**:
```markdown
## Task
- T001: Initialize Nuxt 3 app with TypeScript strict mode and Vuetify 3

## Changes
- Set up Nuxt 3 directory structure
- Configured Vuetify 3 theme
- Enabled TypeScript strict mode

## Validation
- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes (zero warnings)
- [x] `pnpm build` succeeds
- [x] `pnpm dev` runs without errors

## Screenshots (if applicable)
- (blank Nuxt 3 homepage loads)
```

---

## Command Reference

### Development

```bash
# Start dev server
pnpm --filter @trader-frontend/trader dev

# Run tests
pnpm --filter @trader-frontend/trader test

# Run linter
pnpm --filter @trader-frontend/trader lint

# Type check
pnpm --filter @trader-frontend/trader typecheck

# Build production
pnpm --filter @trader-frontend/trader build

# Preview built artifact
pnpm --filter @trader-frontend/trader preview
```

### Workspace

```bash
# List all workspaces
pnpm list --depth=0

# Update dependencies across workspace
pnpm install

# Run command in all workspaces
pnpm --recursive lint
```

---

## Common Tasks

### Running the Trader App

```bash
cd apps/trader
pnpm dev
# → http://localhost:3000
```

### Adding a Dependency to Trader App

```bash
pnpm --filter @trader-frontend/trader add axios
pnpm --filter @trader-frontend/trader add -D @types/node
```

### Creating a New Component

```bash
# Create at apps/trader/src/components/MyComponent.vue
# Ensure it's typed:
<script setup lang="ts">
interface Props {
  title: string
  count: number
}
defineProps<Props>()
</script>

<template>
  <div>{{ title }}: {{ count }}</div>
</template>
```

### Writing a Test

```bash
# Create test at apps/trader/src/composables/__tests__/useMyComposable.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { useMyComposable } from '../useMyComposable'

describe('useMyComposable', () => {
  it('should return expected value', () => {
    const { value } = useMyComposable()
    expect(value).toBe('expected')
  })
})
```

### Linting & Formatting

```bash
# Auto-fix linting issues
pnpm --filter @trader-frontend/trader lint --fix

# Format with Prettier
pnpm --filter @trader-frontend/trader format

# Check all at once
pnpm --filter @trader-frontend/trader test && pnpm --filter @trader-frontend/trader lint && pnpm --filter @trader-frontend/trader typecheck
```

---

## Understanding the Spec

### spec.md (Requirements)

- **User Stories**: What operators need to do
- **Acceptance Criteria**: How to verify implementation is correct
- **Architecture**: Component hierarchy and data flow
- **Constraints**: Technology stack, performance targets

**When to Read**: Before starting a new component or feature

### plan.md (Timeline & Phases)

- **Work Blocks**: Groups of related tasks
- **Effort Estimation**: Days per work block
- **Validation Gates**: Quality checkpoints before advancing phases
- **Risks**: Known challenges and mitigation strategies

**When to Read**: To understand project timeline and dependencies

### tasks.md (Task Checklist)

- **Granular Tasks**: T001, T002, ..., T070
- **Dependencies**: Which tasks must be done first
- **Validation Criteria**: How to verify each task is complete

**When to Read**: Every day to pick your next task

### system-design.md (Architecture & Implementation)

- **Pinia Stores**: State shape and actions
- **Composables**: Reusable logic patterns
- **Components**: Hierarchy and data flow
- **API Contracts**: Endpoints, error codes, retry logic
- **File Structure**: Directory layout and naming conventions

**When to Read**: When implementing a new component or integrating with backend

### quickstart.md (Getting Started)

- **Setup Instructions**: Prerequisites and initial setup
- **First Task Walkthrough**: Example of how to complete a task
- **Common Patterns**: Code snippets for typical implementations
- **Troubleshooting**: FAQ and debug tips

**When to Read**: First day, or when stuck

---

## Validation Checkpoints

Each phase has a validation gate. Before proceeding to the next phase, verify:

### P1 Validation Gate (Day 22)

- [ ] Dashboard loads in < 2 seconds
- [ ] Watchlist filters persist across page refresh
- [ ] Backtest history displays ≥ 20 runs
- [ ] All API calls wrapped in `useTraderApi`
- [ ] ESLint and TypeScript strict mode pass
- [ ] Unit tests: ≥ 70% coverage for composables
- [ ] No console errors in DevTools

### P2 Validation Gate (Day 35)

- [ ] Positions table updates every 5s without lag
- [ ] Kill-switch button executes within 2s
- [ ] Token refresh handles 401 errors gracefully
- [ ] Integration tests for mutations pass
- [ ] All P1 criteria still met (no regressions)

### P3 Validation Gate (Day 48)

- [ ] Signal correlation matrix renders correctly
- [ ] Configuration form validates all constraints
- [ ] Audit log tracks all mutations
- [ ] ≥ 30 historical trades available for correlation
- [ ] All P1 + P2 criteria still met

---

## Code Standards

### TypeScript

- **Strict Mode**: `"strict": true` enforced
- **No `any`**: Use `unknown` with type guards instead
- **Types on Functions**: All params and return types must be explicit

### Vue 3

- **Script Setup**: Prefer `<script setup>` over Options API
- **Composition API**: Use composables for reusable logic
- **Typed Props**: Interface and `defineProps<Props>()`

### Components

- **Naming**: PascalCase (`MyComponent.vue`)
- **Location**: Group by feature in `components/[feature]/`
- **Props**: Always typed, always documented
- **Emits**: Explicit with types

### Composables

- **Naming**: camelCase starting with `use` (`useTraderApi`)
- **Location**: `composables/` folder
- **Return Type**: Explicitly typed return object

### Testing

- **File Location**: Colocated with source (`useMyComposable.spec.ts` next to `useMyComposable.ts`)
- **Coverage Target**: ≥ 70% for composables, ≥ 50% for components
- **Mocking**: Mock API calls, not business logic

### Linting & Formatting

- **ESLint**: Must pass with zero warnings
- **Prettier**: Must be formatted (auto-fixes with `--fix`)
- **Pre-commit Hook**: (Optional, recommended for team workflow)

---

## Troubleshooting

### `pnpm install` fails

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

### `pnpm dev` shows TypeScript errors

```bash
# Ensure strict mode is enabled in tsconfig.json
# Fix errors incrementally—don't add eslint-disable comments
pnpm typecheck    # See all errors
# Fix each one manually
```

### ESLint complains about unused variables

```bash
# Add underscore prefix for intentional unused vars
const _unused = getValue()
```

### Performance bundle is too large

```bash
# Analyze what's in bundle
npm install -g vite-bundle-visualizer
vite-bundle-visualizer  # opens HTML report

# Then:
# - Lazy-load components not on homepage
# - Tree-shake unused Vuetify components
# - Split large components into async chunks
```

### Tests fail with "Cannot find module"

```bash
# Ensure test file path matches source import
# Example: if importing from '~/composables/useApi'
# Test should be at src/composables/__tests__/useApi.spec.ts
```

---

## Resources

- **Nuxt 3 Docs**: https://nuxt.com/docs
- **Vue 3 Docs**: https://vuejs.org/guide/
- **Pinia Docs**: https://pinia.vuejs.org/
- **Vuetify 3 Docs**: https://vuetifyjs.com/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Spec Docs**: [specs/001-trader-frontend/](specs/001-trader-frontend/) and [specs/002-music-library-control-center/](specs/002-music-library-control-center/)

---

## Next Steps

1. **Read** the spec package you are joining: [specs/001-trader-frontend/quickstart.md](specs/001-trader-frontend/quickstart.md) or [specs/002-music-library-control-center/quickstart.md](specs/002-music-library-control-center/quickstart.md) (15 min)
2. **Setup** ([Prerequisites](#prerequisites) and [Setup](#installation) sections above) (10 min)
3. **Pick a Task** from the relevant task list, either [specs/001-trader-frontend/tasks.md](specs/001-trader-frontend/tasks.md) or [specs/002-music-library-control-center/tasks.md](specs/002-music-library-control-center/tasks.md) (5 min)
4. **Start Coding** (refer to the matching system design, for example [specs/001-trader-frontend/system-design.md](specs/001-trader-frontend/system-design.md) or [specs/002-music-library-control-center/system-design.md](specs/002-music-library-control-center/system-design.md))

---

**Happy coding!** 🚀

For questions, start from the matching feature package and its supporting docs.
