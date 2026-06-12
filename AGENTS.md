# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-25T04:55:00Z
**Commit:** ed4c850
**Branch:** main

## OVERVIEW

Cluttr: React Native home inventory app with Expo (expo-router, entry `app/_layout.tsx`), Redux Toolkit + Saga for state management, bottom-sheet modals with IME-safe uncontrolled inputs for Chinese text. **The backend is 100% Firebase** (project `cluttr-app-f3c18`): Auth + Firestore (data, real-time listeners) + Storage (images). There is no custom server.

## FIREBASE

### IaC Requirement

**Any change that enables, disables, or reconfigures a Firebase service MUST be accompanied by an update to the configuration files listed below.** These files serve as the Infrastructure-as-Code (IaC) source of truth so that Firebase project state can be reproduced from the repository.

| File | Purpose |
|------|---------|
| `firebase.json` | Declares enabled services, Auth providers, Firestore rules/indexes, Storage rules |
| `.firebaserc` | Maps environment aliases (`default`, `staging`, `production`) to Firebase project IDs |
| `firestore.rules` | Firestore security rules — the entire authorization model (roles, sharing toggles, invitations) lives here |
| `firestore.indexes.json` | Composite indexes (currently empty — the only query is a single `array-contains`; adding `orderBy` to the homes query would require one) |
| `storage.rules` | Storage security rules (avatars, home-scoped media) |

### Auth Providers

Currently enabled (see `firebase.json`):

| Provider | Notes |
|----------|-------|
| Email / Password | Standard sign-in; password-reset emails sent by Firebase |
| Google | Uses `@react-native-google-signin/google-signin` on the client; requires `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` |
| Apple | iOS 13+ only; uses `expo-apple-authentication` + Firebase Apple credential |

To add a new provider:
1. Enable it in Firebase Console → Authentication → Sign-in method.
2. Add the provider entry under `auth.providers` in `firebase.json`.
3. Implement the sign-in flow in `src/services/FirebaseAuthService.ts`.

### Data Layer: Firestore

All app data lives in Firestore, accessed directly from the client with `@react-native-firebase/firestore` (offline persistence on by default). Schema:

```
users/{uid}                               email, nickname, avatarUrl, timestamps
homes/{homeId}                            name, address, ownerId, settings{canShareInventory,canShareTodos},
                                          invitationCode, members{uid→{role,joinedAt,inviteCode?}}, memberIds[]
homes/{homeId}/inventory/{id}             item fields + batches[] array
homes/{homeId}/inventoryCategories/{id}
homes/{homeId}/locations/{id}
homes/{homeId}/todos/{id}
homes/{homeId}/todoCategories/{id}
invitations/{code}                        doc ID = invitation code; homeId + denormalized preview
                                          (homeName, owner profile, settings) for non-member validation
```

- **Timestamps are ISO strings** (client clock), not Firestore Timestamps.
- `memberIds` mirrors `members` keys (enforced by rules) so the homes list is one live query: `homes.where('memberIds','array-contains',uid)`.
- **Reads are real-time**: each domain saga wraps `onSnapshot` in a redux-saga `eventChannel` (`createSnapshotChannel` in `src/services/firebase/firestoreRefs.ts`), subscribed via `takeLatest(setActiveHomeId, ...)` — switching home or logging out auto-cancels the previous listener. The homes listener lives in `authSaga`.
- **Writes are fire-and-forget** (`fireWrite` helper): latency compensation updates the local snapshot immediately (even offline); errors surface as toasts. Inventory/location field edits are debounced 400 ms to coalesce billed writes.
- **Invitations are rules-only** (no server): accepting = the invitee updates the home doc adding their own membership entry; rules validate the code doc. See `src/services/InvitationService.ts`.
- **Home deletion cascade is client-side** (`HomeService.deleteHome`): batch-delete subcollections → invitation doc → home doc last (rules deny subcollection access once the home doc is gone, so orphans are unreachable; retry-safe).
- **Access revocation signal**: the home disappearing from the homes snapshot (and `permission-denied` on domain listeners → `accessDenied` action).

## STRUCTURE

```
./
├── src/
│   ├── components/        # Reusable UI: atoms/, molecules/, organisms/
│   │   └── organisms/     #   + organisms/bottom-sheets/ (all *BottomSheet + shared/sheetPrimitives)
│   │                      #   + organisms/forms/ (ItemFormFields)
│   ├── screens/           # Screen components + per-screen subdirs:
│   │                      #   notes/, item-details/, settings/, profile/
│   ├── store/             # Redux Toolkit + Saga (slices/, sagas/, sagas/helpers/, hooks.ts)
│   ├── navigation/         # React Navigation 2-level (RootStack + 4 tabs)
│   ├── services/           # Business logic (Firestore services, createCrudService, FirebaseAuthService, firebase/firestoreRefs.ts)
│   ├── utils/              # Shared utilities (Logger, formatters, toastRegistry, validation)
│   ├── hooks/              # Custom React hooks (useKeyboardVisibility, useItemForm, useBatchForm, useBottomSheetLifecycle, useToast, useHome, useItemActions, useNetwork)
│   ├── types/              # TypeScript types (inventory, home, user, settings, errors)
│   ├── theme/              # Styled-components theme
│   ├── i18n/              # i18next locales (en, zh-CN)
│   └── data/               # Static config (categories, locations, statuses)
└── app/_layout.tsx        # expo-router entry with provider nesting
```

Components use atomic design: `src/components/{atoms,molecules,organisms}`.

## WHERE TO LOOK

| Task                | Location                                                                             | Notes                                            |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Redux state/actions | `src/store/slices/*.ts`, `src/store/sagas/*.ts`                                      | Use domain hooks from `src/store/hooks.ts`       |
| Firestore refs/converters/channels | `src/services/firebase/firestoreRefs.ts`                              | Collection refs, doc⇄domain converters, `createSnapshotChannel`, `fireWrite` |
| Data writes         | `src/services/{Inventory,Todo,Location,InventoryCategory,TodoCategory}Service.ts`     | Slim write helpers built on `createCrudService.ts`; import singletons directly |
| Homes/members       | `src/services/HomeService.ts`                                                        | Snapshot-fed; cascade delete, leave/remove member |
| Invitations         | `src/services/InvitationService.ts`                                                  | Code create/validate/accept (rules-validated)    |
| User profiles       | `src/services/UserService.ts`                                                        | `users/{uid}` docs: ensure, update, member join  |
| Navigation          | `src/navigation/RootStack.tsx`, `src/navigation/TabNavigator.tsx`                    | 2-level: RootStack (modals) + MainTabs (screens) |
| Form patterns       | `src/components/organisms/bottom-sheets/ItemFormBottomSheet.tsx`                     | IME-safe uncontrolled inputs (create + edit modes) |
| Sheet lifecycle     | `src/hooks/useBottomSheetLifecycle.ts`, `src/components/organisms/bottom-sheets/shared/sheetPrimitives.tsx` | Open/close/reset lifecycle + shared sheet styled primitives |
| Swipe actions       | `src/components/molecules/SwipeableRow.tsx`                                          | Shared iOS-style swipe-to-edit/delete; used by HomeScreen, ItemDetailsScreen, NotesScreen, MemberCard |
| Styling             | `src/theme/ThemeProvider.tsx`, `src/utils/styledComponents.ts`                       | Theme via `useTheme()`, styled via `StyledProps` |
| Firebase auth       | `src/services/FirebaseAuthService.ts`                                                | Email/Google/Apple sign-in, password reset       |
| Security rules      | `firestore.rules`, `storage.rules`                                                   | The entire authorization model                   |

## CONVENTIONS

- **Redux hooks pattern**: Use `useAuth()`, `useInventory()`, etc. from `src/store/hooks.ts` - NOT Context providers
- **Uncontrolled inputs**: Bottom sheet forms use `defaultValue` + refs for IME composition (Chinese Pinyin support)
- **Top-level BottomSheetModal styling**: ALWAYS set `backgroundStyle={{ backgroundColor: theme.colors.background }}` and use rounded `ContentContainer` for dark mode support
- **Data access**: import service singletons directly (`homeService`, `userService`, `inventoryService`, …); never instantiate Firestore collection refs ad hoc in components — add them to `firestoreRefs.ts`
- **Styled-components**: Inject theme via `({ theme }: StyledProps) => ...`
- **Saga pattern**: Domain sagas in `src/store/sagas/`; listeners via `takeLatest([setActiveHomeId, LOAD_*], subscribe*Saga)` with `eventChannel`, writes via service helpers
- **Selector pattern**: Memoized with `createSelector` (inventorySlice, todoSlice)
- **Swipe actions**: wrap rows in the `SwipeableRow` molecule (`onEdit`/`onDelete` callbacks + labels; omit a callback to hide that pill — no actions renders plain children, useful for permission-gated rows). It owns one-open-at-a-time, haptics, close-before-action, and a11y labels. Composition order: `SwipeableRow > ContextMenu > Card`; keep row spacing on the wrapper (`style` prop / list `gap`), NOT on the card, so the action pills match card height
- **OAuth client IDs**: Use iOS/Android client IDs (NOT Web) with custom scheme `com.cluttrapp.cluttr://`
- **Firebase keys**: Never commit `GoogleService-Info.plist` or `google-services.json` (gitignored).
- **Firebase SDK**: Version-locked (currently `^23.x.x` for `@react-native-firebase/*`).

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** await Firestore writes in UI/saga flows (they block until server ack and hang offline) — use the `fireWrite` helper; await only explicit, online-expected operations (home delete cascade, invitation accept, profile/avatar update)
- **NEVER** write `undefined` into Firestore docs (rejected) — `ignoreUndefinedProperties` is enabled in `firestoreRefs.ts`, but prefer explicit `null`
- **NEVER** change the Firestore schema or membership model without updating `firestore.rules` in the same change (IaC rule above)
- **NEVER** use controlled inputs (`value` prop) in bottom sheet modals - breaks IME composition
- **NEVER** use the deprecated `Swipeable` from `react-native-gesture-handler` or hand-roll swipe-action UI — use the `SwipeableRow` molecule (built on `ReanimatedSwipeable`; legacy usages fully migrated 2026-06-11)
- **NEVER** use Web OAuth client IDs for authentication - only iOS (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`) and Android (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`). *Note: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is used for Firebase Auth configuration only.*
- **NEVER** use `console.log()` - use Logger from `src/utils/Logger.ts`
- **NEVER** suppress type errors with `as any` or `@ts-ignore`
- **ALWAYS** run `npm run lint` after edits (enforced by `.cursor/rules/eslint-ensure.mdc`)

## UNIQUE STYLES

- **Dual-state IME pattern**: Store form values in refs (update on `onChangeText`), sync to state on blur/submit, reset with `key` prop
- **Non-serializable Redux**: callback Sets / Sets of ids stored in state (explicitly ignored in serializableCheck)
- **Snapshot-as-truth**: sagas apply optimistic slice updates for instant feedback, but the Firestore snapshot always wins — there is no revert logic
- **HomeService observer**: homes live outside Redux in `homeService` (observer pattern), fed by the authSaga homes channel; `useHome()` subscribes
- **Promise-based hooks**: `useSettings()` uses Promise + timeout to track update completion
- **2-level navigation**: RootStack (modals/screens) → MainTabs (bottom tabs) → Home/Notes/Share/Settings stacks

## COMMANDS

```bash
# Development
npm start              # Expo dev server
npm run ios            # iOS simulator
npm run android          # Android emulator
npm run web            # Web version

# Firebase deployment
firebase deploy --only auth      # Auth configuration
firebase deploy --only firestore # Firestore rules + indexes
firebase deploy --only storage   # Storage rules
firebase deploy                  # All services

# Code quality
npm run format          # Format code
npm run format:check    # Check formatting
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues

# Build (via Makefile)
make install-deps                    # npm install --legacy-peer-deps
make build-ios-local                 # Local iOS build
make build-android-local             # Local Android build
make build-ios-internal-local        # Local internal IPA
make build-android-internal-local    # Local internal APK
make build-ios-production-local      # Local production build (auto-increments build number)
```

## DEV HARNESS (AI LOOP)

**E2E test playbook: see `E2E_TESTS.md`** — detailed CUJs/test cases (auth, inventory, todos, homes, sharing/invitations, real-time, avatar), harness operation gotchas, admin Firestore REST access for verification, and state-reset/cleanup procedures. Use it to run smoke or full regression passes.

`scripts/harness.sh` runs the app on the iOS simulator (Expo dev client) and lets an agent interact with it and read feedback. Runtime state lives in `.harness/` (gitignored). UI driver: [AXe](https://github.com/cameroncooke/AXe) (`brew install cameroncooke/axe/axe`).

```bash
# Lifecycle
./scripts/harness.sh doctor            # Check tooling, sim, app install, Metro health
./scripts/harness.sh up                # Boot sim, start Metro (background), launch dev client
./scripts/harness.sh down [--shutdown] # Stop Metro (optionally shut down sim)
./scripts/harness.sh status            # Sim/Metro/app state + recent log lines
./scripts/harness.sh build             # Local eas dev-client build + install (slow; only
                                       # needed when native deps / app.json plugins change)

# Feedback
./scripts/harness.sh logs [-n N | -f]  # Tail Metro log (app Logger output lands here)
./scripts/harness.sh screenshot [name] # PNG to .harness/screenshots/, prints path
./scripts/harness.sh ui                # Accessibility tree JSON (axe describe-ui)

# Interaction (axe wrappers, simulator UDID auto-resolved)
./scripts/harness.sh tap --label "Log In"   # or: tap -x 201 -y 592
./scripts/harness.sh type 'hello'
./scripts/harness.sh swipe|key|button|touch|gesture ...
./scripts/harness.sh reload            # Full JS reload (Fast Refresh on save is automatic)
```

**Canonical loop**: edit code → Fast Refresh applies automatically (use `reload` after .env/i18n changes) → `screenshot` / `ui` / `logs` to observe → `tap`/`type` to interact.

**Harness tips (learned in practice):**
- RN `TextInput` placeholders show up as TextField **values**, not labels, in the accessibility tree — tap inputs by coordinates from `ui` frames; tap a field first, then `type`.
- Some buttons (e.g. styled Touchables) expose no accessibility label — fall back to coordinate taps. Frames in `ui` are in points and match screenshot pixels ÷ 3.
- Stray typing with no focused field can open the Expo dev menu — close it via `tap --label "Close"`.
- `up`/`reload` auto-accept the iOS "Open in Cluttr?" deep-link dialog.
- Fast Refresh can serve stale code after multi-file edits — if the UI doesn't match fresh changes, `reload` before debugging.
- Swipe a row left to reveal swipe actions: `swipe --start-x 360 --start-y <rowY> --end-x 100 --end-y <rowY>`. Pill labels ("Modify"/"Delete") can collide with other on-screen buttons — tap by coordinates when ambiguous (more in E2E_TESTS.md §2.3).

**Test accounts** (Firebase email/password, created via the signup UI):
- Primary: `juncapersonal+cluttr-ai-test@gmail.com` / `Cluttr-AI-e16c71d6e9f2` (UID `LhiZ0HUZIIYL4NdA56Ce55jt4Wo1`, nickname "Cluttr Tester")
- Secondary (for sharing/invitation tests): `juncapersonal+cluttr-ai-test2@gmail.com` / `Cluttr-AI-e16c71d6e9f2` (nickname "Tester Two", member of the primary account's "My Home")

## NOTES

- **Legacy Railway backend (`cluttr-server-v2`) is fully decommissioned client-side** (2026-06-11): ApiClient and all `/api/*` calls were replaced with direct Firestore/Storage access. The AI item-recognition feature was removed with it (would need a Cloud Function to re-add).
- **Targeted jest suites exist** (`npx jest`): pure-logic specs colocated in `__tests__/` dirs (slices, saga helpers, createCrudService, utils) — `ts-jest`, node environment, no component tests
- **Saga helpers**: `requireActiveHomeId` (select active home or throw) and `handleSagaError` (log + slice `setError` + toast) in `src/store/sagas/helpers/` are the shared head/tail of domain saga operations
- **Toast outside React**: sagas/services surface toasts via `src/utils/toastRegistry.ts` (`setGlobalToast`/`getGlobalToast`), registered by the toast provider
- **IME composition critical** - Chinese input requires uncontrolled pattern to prevent keyboard reset on each keystroke
