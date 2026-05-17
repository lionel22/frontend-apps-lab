# Quickstart: Trader Frontend Development

**Welcome to the Trader Frontend specification!** This guide helps you get started with implementing the trader frontend.

---

## What Is This?

You're building a Nuxt 3 + Vue 3 frontend for the Breexio trader platform backend. The spec is divided into three phases:

- **P1** (Weeks 1–4): Dashboard, watchlist, backtest views (16 days)
- **P2** (Weeks 5–7): Live trading controls, positions, kill-switch (13 days)
- **P3** (Weeks 8–10): Signal correlation, config mutations, audit log (12 days)

---

## How to Read the Spec

1. **Start here**: [quickstart.md](quickstart.md) (you are here)
2. **Understand the goal**: [spec.md](spec.md) — Read User Stories 1–3 and Architecture
3. **See the plan**: [plan.md](plan.md) — Phases, work blocks, effort, validation gates
4. **Track tasks**: [tasks.md](tasks.md) — Detailed checklist (mark items as you complete them)
5. **Dive deep**: [system-design.md](system-design.md) — Component hierarchy, Pinia stores, API contracts

---

## Prerequisites

- **Node.js** 18+
- **pnpm** (monorepo package manager)
- **Git** (already set up in the repo)
- **Docker** (optional, for mock backend during development)

---

## Initial Setup

### 1. Install Dependencies

```bash
cd frontend-apps-lab
pnpm install
```

### 2. Verify Scaffold

```bash
# Should show no errors
cd apps/trader
pnpm build
```

### 3. Run Dev Server

```bash
cd apps/trader
pnpm dev
# → http://localhost:3000
```

Open your browser. You should see a blank Nuxt 3 app.

---

## First Task: Setup & Infrastructure (Days 1–6)

Complete tasks **T001–T006** from [tasks.md](tasks.md):

- [ ] T001: Nuxt 3 scaffold with directory structure
- [ ] T002: Pinia stores (trader, ui, cache)
- [ ] T003: Vuetify 3 theme setup
- [ ] T004: `useTraderApi` composable (HTTP error handling)
- [ ] T005: `usePolling` composable (real-time updates)
- [ ] T006: Utils (formatters, validators, constants)

### Estimated Timeline

- **Small task**: 1 day (e.g., T001, T003, T005, T006)
- **Medium task**: 2–3 days (e.g., T004)

### Success Checklist

- [ ] `pnpm dev` runs without errors
- [ ] TypeScript strict mode enabled (`"strict": true` in tsconfig.json)
- [ ] Pinia stores export properly (can be imported in components)
- [ ] `useTraderApi` returns `{ data, error, loading, refetch }`
- [ ] `usePolling` auto-pauses when tab loses focus
- [ ] All utility functions tested

---

## Phase 1: Dashboard & Watchlist (Days 7–22)

After setup completes, tackle the core UI features:

### Dashboard (Days 7–13)

- [ ] Status cards showing trading mode, kill-switch state, watchlist count
- [ ] Signal heatmap with real-time symbol × signal grid
- [ ] Polling integration (updates every 30s)

**Backend dependency**: `/dashboard/status` and `/signals` endpoints

### Watchlist (Days 14–18)

- [ ] Asset table with symbol, sector, liquidity tier, price columns
- [ ] Sector and liquidity tier filters
- [ ] Filter state persists across page refresh

**Backend dependency**: `/watchlist` endpoint

### Backtest (Days 19–28)

- [ ] Backtest history view (list of runs with parameters and metrics)
- [ ] Launch modal (form to start a new backtest)
- [ ] Results page with equity curve chart and trade log

**Backend dependency**: `/backtest/list`, `/backtest/launch`, `/backtest/{id}` endpoints

### Phase 1 Validation Gate

Before moving to P2, verify:

- [ ] Dashboard loads in < 2 seconds
- [ ] All views render without console errors
- [ ] Polling updates data on schedule (no lag)
- [ ] Unit tests pass with ≥70% coverage for composables
- [ ] ESLint and TypeScript strict mode pass

---

## Development Workflow

### Daily Standup

- What tasks completed today?
- What tasks planned for today?
- Any blockers?

### Code Review Checklist

Before submitting a PR:

1. **Functionality**: Does it implement the task correctly?
2. **Testing**: Are composables and utils tested (≥70% coverage)?
3. **Code Quality**: Does it pass ESLint and TypeScript strict mode?
4. **Performance**: Does it avoid unnecessary re-renders? (Vue DevTools Profiler)
5. **Accessibility**: Are form inputs labeled? Are error states visible?

### Testing

```bash
# Run tests
pnpm --filter @trader-frontend/trader test

# Run linter
pnpm --filter @trader-frontend/trader lint

# Type check
pnpm --filter @trader-frontend/trader typecheck

# Build production artifact
pnpm --filter @trader-frontend/trader build
```

---

## Parallel Development with Mock Backend

If the backend isn't ready yet, use **json-server** or **Mock Service Worker** to mock API responses:

```bash
# Option 1: json-server (quick local mock)
npm install -g json-server
echo '{}' > db.json
json-server --watch db.json --port 3001

# Option 2: MSW (Modern, recommended)
pnpm add --save-dev msw
# Set up handlers in src/test/mocks/handlers.ts
```

Then update `constants.ts`:

```typescript
export const API_BASE_URL = 
  process.env.NODE_ENV === 'test' 
    ? 'http://localhost:3001'
    : (process.env.NUXT_PUBLIC_API_URL || 'https://api.trader.example.com')
```

---

## Common Patterns

### Fetching Data in a Component

```vue
<script setup lang="ts">
import { useTraderApi } from '~/composables/useTraderApi'

const { data: positions, error, loading, refetch } = useTraderApi(
  '/positions',
  { method: 'GET' }
)
</script>

<template>
  <div v-if="loading" class="spinner">Loading...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <table v-else>
    <tr v-for="pos in positions" :key="pos.id">
      <td>{{ pos.symbol }}</td>
      <td>{{ pos.pnl }}</td>
    </tr>
  </table>
  <button @click="refetch">Refresh</button>
</template>
```

### Polling in a Component

```vue
<script setup lang="ts">
import { usePolling } from '~/composables/usePolling'

const { data: positions, loading, error } = usePolling(
  async () => {
    const res = await fetch('/api/positions')
    return res.json()
  },
  { interval: 5000 }  // 5 seconds
)
</script>
```

### Pinia Store Mutation

```typescript
// stores/trader.ts
export const useTraderStore = defineStore('trader', {
  state() {
    return {
      positions: [],
      killSwitchState: 'ENABLED'
    }
  },
  actions: {
    async executeKillSwitch() {
      const res = await fetch('/api/trading/kill-switch', {
        method: 'POST'
      })
      const data = await res.json()
      this.killSwitchState = data.state
      useCacheInvalidation().invalidate('status')
    }
  }
})
```

### Validation Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { validateWeights, validateThreshold } from '~/utils/validators'

const weights = ref({ signal1: 0.5, signal2: 0.5 })
const errors = ref<Record<string, string>>({})

const handleSubmit = () => {
  errors.value = {}
  
  const weightError = validateWeights(weights.value)
  if (weightError) {
    errors.value.weights = weightError
    return
  }
  
  // Submit form
  api.post('/config', weights.value)
}
</script>
```

---

## Troubleshooting

### Q: `pnpm dev` fails with "Cannot find module"

**A**: Run `pnpm install` and restart dev server.

### Q: TypeScript strict mode errors everywhere

**A**: This is expected at first. Fix errors incrementally:
- Add types to all function params
- No `any` types (use `unknown` and type-guard instead)
- Check Nuxt docs for composable typing patterns

### Q: Polling updates cause excessive re-renders

**A**: Use Vue DevTools Profiler to identify bottleneck. Consider:
- Only update changed rows in table (don't re-render entire list)
- Use `computed` instead of `ref` for derived data
- Add `:key` to list items to help Vue track changes

### Q: Backend API returns 401 on every request

**A**: Check token refresh logic in `useTraderApi`:
1. Verify `/auth/refresh` endpoint exists on backend
2. Confirm token stored in localStorage correctly
3. Add console logs to debug token refresh flow

### Q: Performance bundle is > 500 KB

**A**: Analyze bundle:
```bash
pnpm build --analyze
# or
npm install -g vite-bundle-visualizer
```

Then:
- Lazy-load components that aren't on homepage
- Tree-shake unused Vuetify components
- Consider splitting large components into smaller async chunks

---

## Resources

### Documentation

- **Nuxt 3**: https://nuxt.com/docs
- **Vue 3**: https://vuejs.org/guide/
- **Pinia**: https://pinia.vuejs.org/
- **Vuetify 3**: https://vuetifyjs.com/
- **TypeScript**: https://www.typescriptlang.org/docs/

### Examples in This Repo

- **Trader Backend** (API reference): `../../nestjs-apps-lab/apps/trader/`
- **Spec Files**: [spec.md](spec.md), [plan.md](plan.md), [system-design.md](system-design.md)

### Community Help

- **Nuxt Discord**: https://discord.nuxt.dev/
- **Vue Land Discord**: https://discord.vuejs.org/
- **Stack Overflow**: Tag `nuxt` + `vue3`

---

## Next Steps

1. **Now**: Complete setup tasks (T001–T006)
2. **Week 1**: Finish dashboard UI (T007–T013)
3. **Week 2**: Watchlist and backtest views (T014–T028)
4. **Week 3**: Start P2 (positions, trades, kill-switch)
5. **Week 4**: Wrap P1 validation gate, start P2 full-stack integration

---

## Questions?

- **Task unclear?** Check [tasks.md](tasks.md) for detailed Acceptance Criteria
- **Architecture unclear?** Read [system-design.md](system-design.md)
- **Feature unclear?** Review [spec.md](spec.md) User Stories
- **Blocked by backend?** Mock the endpoint and proceed; sync up with backend team

---

**Happy coding!** 🚀
