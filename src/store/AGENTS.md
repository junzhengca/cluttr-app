# STORE ARCHITECTURE

**Updated:** 2026-06-12
**Branch:** refactor/code-quality

## OVERVIEW

Redux Toolkit + Saga with domain hooks replacing React Context. Reads are live Firestore snapshots (eventChannel listeners per domain); writes go through service singletons (fire-and-forget). The snapshot is the source of truth — optimistic slice updates exist for instant feedback, but there is no revert logic.

## STRUCTURE

```
store/
├── index.ts                  # Store config with saga middleware + serializable check exemptions
├── reducers.ts                # Root reducer combining all slices
├── types.ts                  # RootState type definition
├── hooks.ts                  # Domain hooks: useAuth, useSettings, useTodos, useTodoCategories,
│                              # useSelectedCategory, useInventory, useInventoryCategories, useLocations
├── sagas/
│   ├── index.ts              # Root saga forking all domain sagas
│   ├── authSaga.ts           # Auth flow + homes listener; exports `accessDenied`
│   ├── firestoreSubscriptionSaga.ts  # createSubscriptionSaga<T>: generic live-listener saga
│   │                          # (home-scoped query + permission-denied retry/revocation)
│   ├── inventorySaga.ts       # Inventory listener + write operations
│   ├── inventoryCategorySaga.ts
│   ├── locationSaga.ts
│   ├── todoSaga.ts            # Todos + todo categories (both live in todoSlice)
│   ├── settingsSaga.ts        # Settings load/update with i18n
│   └── helpers/
│       ├── requireActiveHomeId.ts  # Select active home id or throw (logged per-domain)
│       └── handleSagaError.ts      # Shared catch tail: log + slice setError + global toast
└── slices/
    ├── authSlice.ts           # Auth state, activeHomeId
    ├── inventorySlice.ts       # Inventory + memoized selectors
    ├── inventoryCategorySlice.ts
    ├── locationSlice.ts
    ├── todoSlice.ts           # Todos + todo categories + memoized selectors
    ├── settingsSlice.ts       # Settings + update result tracking
    ├── uiSlice.ts             # UI state (home category filter)
    └── refreshSlice.ts        # Refresh callback Set (non-serializable, exempted)
```

Pure-logic specs live in colocated `__tests__/` dirs (slices, saga helpers) — run with `npx jest`.

## WHERE TO LOOK

| Task            | Location                              | Notes                                                                      |
| --------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Domain hooks    | `hooks.ts`                            | useAuth, useSettings, useTodos, useTodoCategories, useInventory, useInventoryCategories, useLocations, useSelectedCategory |
| Live listeners  | `sagas/firestoreSubscriptionSaga.ts`  | `createSubscriptionSaga` wired via `takeLatest([setActiveHomeId, LOAD_*], ...)` |
| Saga helpers    | `sagas/helpers/`                      | `requireActiveHomeId`, `handleSagaError`                                    |
| Data writes     | `src/services/*Service.ts`            | Service singletons built on `createCrudService`; sagas call them, never Firestore directly |
| Toasts from sagas | `src/utils/toastRegistry.ts`        | `getGlobalToast()` — registered by the toast provider; used by `handleSagaError` |
| Slice actions   | `slices/*.ts`                         | `set{Property}` reducers; snapshot `setItems`-style actions fed by listeners |

## CONVENTIONS

- **Saga operation shape**: `const homeId = yield* requireActiveHomeId('domain')` → optimistic `put` → service write; `catch` → `yield* handleSagaError(error, {...})`
- **Listener pattern**: build with `createSubscriptionSaga<T>` (query, converter, sort, slice actions); `takeLatest` cancels the previous listener on home switch/logout
- **Slice naming**: `{domain}Slice.ts` → reducer export → import in reducers.ts
- **Action types**: `DOMAIN/OPERATION` (e.g., `'inventory/CREATE_ITEM'`)
- **Selectors**: memoized with `createSelector` (inventorySlice, todoSlice)
- **Optimistic updates**: update state before the write; the Firestore snapshot always wins (no revert logic)

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use React Context for domain state - use hooks from `store/hooks.ts`
- **NEVER** await Firestore writes in sagas - services use the `fireWrite` helper (fire-and-forget)
- **NEVER** hand-roll a snapshot listener loop in a domain saga - use `createSubscriptionSaga`
- **NEVER** duplicate the no-active-home check or error/toast tail - use `requireActiveHomeId` / `handleSagaError`
- **NEVER** import toast hooks into sagas/services - use `utils/toastRegistry.ts`
