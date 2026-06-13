# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-25T04:55:00Z
**Commit:** ed4c850
**Branch:** main

## OVERVIEW

Cluttr: React Native home inventory app with Expo (expo-router, entry `app/_layout.tsx`), Redux Toolkit + Saga for state management, bottom-sheet modals with IME-safe uncontrolled inputs for Chinese text. **The backend is 100% Firebase** (project `cluttr-app-f3c18`): Auth + Firestore (data, real-time listeners) + Storage (images). There is no custom server.

## FIREBASE

### IaC Requirement

**Any change that enables, disables, or reconfigures a Firebase service MUST be accompanied by an update to the configuration files listed below.** These files serve as the Infrastructure-as-Code (IaC) source of truth so that Firebase project state can be reproduced from the repository.

| File                     | Purpose                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `firebase.json`          | Declares enabled services, Auth providers, Firestore rules/indexes, Storage rules                                                        |
| `.firebaserc`            | Maps environment aliases (`default`, `staging`, `production`) to Firebase project IDs                                                    |
| `firestore.rules`        | Firestore security rules — the entire authorization model (roles, sharing toggles, invitations) lives here                               |
| `firestore.indexes.json` | Composite indexes (currently empty — the only query is a single `array-contains`; adding `orderBy` to the homes query would require one) |
| `storage.rules`          | Storage security rules (avatars, home-scoped media)                                                                                      |

### Auth Providers

Currently enabled (see `firebase.json`):

| Provider         | Notes                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Email / Password | Standard sign-in; password-reset emails sent by Firebase                                                              |
| Google           | Uses `@react-native-google-signin/google-signin` on the client; requires `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` |
| Apple            | iOS 13+ only; uses `expo-apple-authentication` + Firebase Apple credential                                            |

To add a new provider:

1. Enable it in Firebase Console → Authentication → Sign-in method.
2. Add the provider entry under `auth.providers` in `firebase.json`.
3. Implement the sign-in flow in `src/services/FirebaseAuthService.ts`.

### Data Layer: Firestore

All app data lives in Firestore, accessed directly from the client with `@react-native-firebase/firestore` (offline persistence on by default). Schema:

```
users/{uid}                               email, nickname, avatarUrl, timestamps
homes/{homeId}                            name, address, ownerId, settings{canShareInventory,canShareTodos},
                                          invitationCode, members{uid→{role,joinedAt,inviteCode?}}, memberIds[],
                                          limitOverrides{inventoryMax?,todoMax?} (console-only; raises item caps)
homes/{homeId}/meta/counters              {inventory, todos} item counts; ±1-updated in the same batch as every
                                          item create/delete; rules enforce the item caps against it
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
- **New homes are seeded client-side** (`seedHomeDefaults`, called from `HomeService.createHome`): 8 inventory categories, 5 locations, 12 todo categories. Names are resolved via i18n at creation time and stored as plain strings — they intentionally do NOT change on later language switches. Invitation accept does not seed.
- **Invitations are rules-only** (no server): accepting = the invitee updates the home doc adding their own membership entry; rules validate the code doc. See `src/services/InvitationService.ts`.
- **Home deletion cascade is client-side** (`HomeService.deleteHome`): batch-delete subcollections → invitation doc → home doc last (rules deny subcollection access once the home doc is gone, so orphans are unreachable; retry-safe).
- **Access revocation signal**: the home disappearing from the homes snapshot (and `permission-denied` on domain listeners → `accessDenied` action).
- **Plan limits (free vs Cluttr Pro)**: constants in `src/data/planLimits.ts`, UI gates via `usePlanLimits()` (paywall/toast), saga backstops in inventory/todo create sagas. Server side, rules enforce member cap (10) and item caps (5000 default, raised per home via console-only `limitOverrides`) against `meta/counters` — every inventory/todo create/delete batches a ±1 counter update (`fireCountedWrite`). Free-tier caps (2 homes, no invites, 100 items/todos) are client-side only: rules can't see RevenueCat entitlements without a backend. Rules numbers and `planLimits.ts` MUST stay in sync. Counter values are doubles (RNFB serializes JS numbers as doubles — rules must not use `is int`).

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
│   ├── services/           # Business logic (Firestore services, createCrudService, FirebaseAuthService, firebase/firestoreRefs.ts)
│   ├── utils/              # Shared utilities (Logger, formatters, toastRegistry, validation)
│   ├── hooks/              # Custom React hooks (useKeyboardVisibility, useItemForm, useBatchForm, useBottomSheetLifecycle, useToast, useHome, useItemActions, useNetwork)
│   ├── types/              # TypeScript types (inventory, home, user, settings, errors)
│   ├── theme/              # Styled-components theme
│   ├── i18n/              # i18next locales (en, zh-CN)
│   └── data/               # Static config + default-home presets (categories, locations, todo categories, statuses)
└── app/                   # expo-router file routes (the ONLY navigation layer)
    ├── _layout.tsx        # providers + root Stack with Stack.Protected auth guards
    ├── (auth)/            # login, signup, forgot-password, reset-password (own Stack)
    ├── (tabs)/            # NativeTabs (_layout) + index/notes/settings + search/ Stack
    ├── ItemDetails.tsx    # pushed from Home/Search (param: itemId)
    └── Profile.tsx        # pushed from PageHeader avatar
```

Components use atomic design: `src/components/{atoms,molecules,organisms}`.

## WHERE TO LOOK

| Task                               | Location                                                                                                    | Notes                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Redux state/actions                | `src/store/slices/*.ts`, `src/store/sagas/*.ts`                                                             | Use domain hooks from `src/store/hooks.ts`                                                            |
| Firestore refs/converters/channels | `src/services/firebase/firestoreRefs.ts`                                                                    | Collection refs, doc⇄domain converters, `createSnapshotChannel`, `fireWrite`                          |
| Data writes                        | `src/services/{Inventory,Todo,Location,InventoryCategory,TodoCategory}Service.ts`                           | Slim write helpers built on `createCrudService.ts`; import singletons directly                        |
| Homes/members                      | `src/services/HomeService.ts`                                                                               | Snapshot-fed; cascade delete, leave/remove member                                                     |
| Default home seeding               | `src/services/seedHomeDefaults.ts`, `src/data/default{Categories,Locations,TodoCategories}.ts`              | i18n-resolved names at creation time; invoked from `HomeService.createHome`                           |
| Invitations                        | `src/services/InvitationService.ts`                                                                         | Code create/validate/accept (rules-validated)                                                         |
| User profiles                      | `src/services/UserService.ts`                                                                               | `users/{uid}` docs: ensure, update, member join                                                       |
| Navigation                         | `app/_layout.tsx`, `app/(tabs)/_layout.tsx`                                                                 | expo-router file routes; `Stack.Protected` guards on auth; screens navigate via `useRouter()`         |
| Form patterns                      | `src/components/organisms/bottom-sheets/ItemFormBottomSheet.tsx`                                            | IME-safe uncontrolled inputs (create + edit modes)                                                    |
| Sheet lifecycle                    | `src/hooks/useBottomSheetLifecycle.ts`, `src/components/organisms/bottom-sheets/shared/sheetPrimitives.tsx` | Open/close/reset lifecycle + shared sheet styled primitives                                           |
| Swipe actions                      | `src/components/molecules/SwipeableRow.tsx`                                                                 | Shared iOS-style swipe-to-edit/delete; used by HomeScreen, ItemDetailsScreen, NotesScreen, MemberCard |
| Styling                            | `src/theme/ThemeProvider.tsx`, `src/utils/styledComponents.ts`                                              | Theme via `useTheme()`, styled via `StyledProps`                                                      |
| Firebase auth                      | `src/services/FirebaseAuthService.ts`                                                                       | Email/Google/Apple sign-in, password reset                                                            |
| Security rules                     | `firestore.rules`, `storage.rules`                                                                          | The entire authorization model                                                                        |
| Subscriptions (RevenueCat)         | `src/services/PurchasesService.ts`, `src/hooks/useSubscription.ts`                                          | Cluttr Pro entitlement, paywall, Customer Center; setup guide in `REVENUECAT.md`                      |
| Plan limits (free vs Pro)          | `src/data/planLimits.ts`, `src/hooks/usePlanLimits.ts`                                                      | Caps + UI gates; server enforcement in `firestore.rules` (`meta/counters`, `limitOverrides`)          |

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
- **Firebase SDK**: Version-locked (currently `^24.x.x` for `@react-native-firebase/*`). The codebase uses the namespaced API (`firestore().collection(...)`), so Firestore types come from the `FirebaseFirestoreTypes` namespace — the root type exports (`DocumentSnapshot` etc.) are for the modular API only.
- **Icons**: `@react-native-vector-icons/{ionicons,material-design-icons}` with `/static` imports (fonts linked natively via each package's config plugin in `app.json`). The components have no `glyphMap` static — use the `IoniconsName`/`MaterialCommunityIconsName` aliases from `src/types/icons.ts` for icon-name types. Do NOT reintroduce `@expo/vector-icons`.

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** await Firestore writes in UI/saga flows (they block until server ack and hang offline) — use the `fireWrite` helper; await only explicit, online-expected operations (home delete cascade, invitation accept, profile/avatar update)
- **NEVER** write `undefined` into Firestore docs (rejected) — `ignoreUndefinedProperties` is enabled in `firestoreRefs.ts`, but prefer explicit `null`
- **NEVER** change the Firestore schema or membership model without updating `firestore.rules` in the same change (IaC rule above)
- **NEVER** use controlled inputs (`value` prop) in bottom sheet modals - breaks IME composition
- **NEVER** use the deprecated `Swipeable` from `react-native-gesture-handler` or hand-roll swipe-action UI — use the `SwipeableRow` molecule (built on `ReanimatedSwipeable`; legacy usages fully migrated 2026-06-11)
- **NEVER** use Web OAuth client IDs for authentication - only iOS (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`) and Android (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`). _Note: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is used for Firebase Auth configuration only._
- **NEVER** animate layout props (`height`, `width`, `top`, `bottom`, `left`, `right`) via Reanimated `useAnimatedStyle` worklets — on RN 0.85/Fabric the visual may move but the Fabric shadow tree (hit-testing) does not, or the style silently fails. Use Reanimated CSS transitions (`transitionProperty`/`transitionDuration` in style — see `CollapsibleFilterPanel`) or mount/unmount `entering`/`exiting` animations (see `FloatingActionButton`). `transform`/`opacity` worklet animation is fine.
- **NEVER** use `console.log()` - use Logger from `src/utils/Logger.ts`
- **NEVER** suppress type errors with `as any` or `@ts-ignore`
- **ALWAYS** run `npm run lint` after edits (enforced by `.cursor/rules/eslint-ensure.mdc`)

## UNIQUE STYLES

- **Dual-state IME pattern**: Store form values in refs (update on `onChangeText`), sync to state on blur/submit, reset with `key` prop
- **Non-serializable Redux**: callback Sets / Sets of ids stored in state (explicitly ignored in serializableCheck)
- **Snapshot-as-truth**: sagas apply optimistic slice updates for instant feedback, but the Firestore snapshot always wins — there is no revert logic
- **HomeService observer**: homes live outside Redux in `homeService` (observer pattern), fed by the authSaga homes channel; `useHome()` subscribes
- **Promise-based hooks**: `useSettings()` uses Promise + timeout to track update completion
- **Navigation is pure expo-router** (SDK 56 forked expo-router from React Navigation; `@react-navigation/*` imports are unsupported): root `Stack` in `app/_layout.tsx` with `Stack.Protected guard={isAuthenticated}` for `(tabs)`/`ItemDetails`/`Profile` and `guard={!isAuthenticated}` for `(auth)`; logout/login transitions happen automatically when the guard flips. Tabs are `NativeTabs` (`expo-router/unstable-native-tabs`) with `NativeTabs.Trigger.Label/Icon/VectorIcon` sub-components. Params flow via `useLocalSearchParams`.

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
- **The SDK 56 dev client shows a draggable floating dev-menu button (grey gear) that swallows touches around itself.** It boots at top-right, hidden behind the PageHeader avatar, where it silently blocks the header filter button. If a top-right control ignores taps, drag the gear away (`swipe --start-x 360 --start-y 113 --end-x 30 --end-y 700`) and re-check its position after every reload. Dev-client-only — absent from release builds (E2E_TESTS.md §2.3.13).
- **`type` only supports ASCII** (axe maps characters to hardware keycodes) — CJK/IME input cannot be driven from the harness. Chinese-input behavior in bottom-sheet forms needs a manual pass before release.

**RevenueCat key swap for local purchase testing**: `.env` ships the production platform keys (iOS `appl_…`; Android still pending a `goog_…` key). Real purchases can't run in the simulator (and offerings stay empty until App Store products are registered in RevenueCat), so to test purchase/paywall/limit flows locally, temporarily set BOTH `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` to the Test Store key `test_pScUbcsvKDZWCqlKQLYMxrFEZUA` (simulated purchases; `reload` after editing `.env`). **When done, ALWAYS restore the production key(s) in `.env` before committing or finishing the task.**

**Test accounts** (Firebase email/password, created via the signup UI):

- Primary: `juncapersonal+cluttr-ai-test@gmail.com` / `Cluttr-AI-e16c71d6e9f2` (UID `LhiZ0HUZIIYL4NdA56Ce55jt4Wo1`, nickname "Cluttr Tester")
- Secondary (for sharing/invitation tests): `juncapersonal+cluttr-ai-test2@gmail.com` / `Cluttr-AI-e16c71d6e9f2` (nickname "Tester Two", member of the primary account's "My Home")

## NOTES

- **Legacy Railway backend (`cluttr-server-v2`) is fully decommissioned client-side** (2026-06-11): ApiClient and all `/api/*` calls were replaced with direct Firestore/Storage access. The AI item-recognition feature was removed with it (would need a Cloud Function to re-add).
- **Targeted jest suites exist** (`npx jest`): pure-logic specs colocated in `__tests__/` dirs (slices, saga helpers, createCrudService, utils) — `ts-jest`, node environment, no component tests
- **Saga helpers**: `requireActiveHomeId` (select active home or throw) and `handleSagaError` (log + slice `setError` + toast) in `src/store/sagas/helpers/` are the shared head/tail of domain saga operations
- **Toast outside React**: sagas/services surface toasts via `src/utils/toastRegistry.ts` (`setGlobalToast`/`getGlobalToast`), registered by the toast provider
- **IME composition critical** - Chinese input requires uncontrolled pattern to prevent keyboard reset on each keystroke
