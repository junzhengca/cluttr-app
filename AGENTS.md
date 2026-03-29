# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-25T04:55:00Z
**Commit:** ed4c850
**Branch:** main

## OVERVIEW

Cluttr: React Native home inventory app with Expo, Redux Toolkit + Saga for state management, bottom-sheet modals with IME-safe uncontrolled inputs for Chinese text.

## FIREBASE

### IaC Requirement

**Any change that enables, disables, or reconfigures a Firebase service MUST be accompanied by an update to the configuration files listed below.** These files serve as the Infrastructure-as-Code (IaC) source of truth so that Firebase project state can be reproduced from the repository.

| File | Purpose |
|------|---------|
| `firebase.json` | Declares enabled services, Auth providers, Firestore rules/indexes, Storage rules |
| `.firebaserc` | Maps environment aliases (`default`, `staging`, `production`) to Firebase project IDs |

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

### Backend Integration

The backend **must** verify Firebase ID tokens (not its own JWTs). Every authenticated API request from the app now sends a Firebase ID token as the `Authorization: Bearer <token>` header. The backend should:

1. Use the Firebase Admin SDK to verify the token.
2. Identify users by their Firebase UID (`uid` claim).
3. Auto-create a user record on first sign-in for social login providers.

The `/api/auth/login`, `/api/auth/signup`, `/api/auth/google`, and `/api/auth/apple` backend endpoints are no longer called by the client. These are legacy and should be removed.

## STRUCTURE

```
./
├── src/
│   ├── components/        # Reusable UI (41 files, 3 subdirs: ui/, form/)
│   ├── screens/           # Screen components (10 files)
│   ├── store/             # Redux Toolkit + Saga (17 files: slices/, sagas/, hooks.ts)
│   ├── navigation/         # React Navigation 2-level (RootStack + 4 tabs)
│   ├── services/           # Business logic (SyncService, ApiClient, etc.)
│   ├── utils/              # Shared utilities (11 files: Logger, formatters, validation)
│   ├── hooks/              # Custom React hooks (useKeyboardVisibility, useItemForm, useToast)
│   ├── types/              # TypeScript types (inventory, api, settings)
│   ├── theme/              # Styled-components theme
│   ├── i18n/              # i18next locales (en, zh-CN)
│   └── data/               # Static config (categories, locations, statuses)
└── App.tsx               # Entry with provider nesting
```

## WHERE TO LOOK

| Task                | Location                                                                             | Notes                                            |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Redux state/actions | `src/store/slices/*.ts`, `src/store/sagas/*.ts`                                      | Use domain hooks from `src/store/hooks.ts`       |
| API calls           | `src/services/ApiClient.ts`                                                          | Get client via `useAuth().getApiClient()`        |
| Navigation          | `src/navigation/RootStack.tsx`, `src/navigation/TabNavigator.tsx`                    | 2-level: RootStack (modals) + MainTabs (screens) |
| Sync logic          | `src/services/SyncService.ts`                                                        | File I/O, queue management, conflict resolution  |
| Form patterns       | `src/components/CreateItemBottomSheet.tsx`, `src/components/EditItemBottomSheet.tsx` | IME-safe uncontrolled inputs                     |
| Styling             | `src/theme/ThemeProvider.tsx`, `src/utils/styledComponents.ts`                       | Theme via `useTheme()`, styled via `StyledProps` |
| Firebase logic      | `src/services/FirebaseAuthService.ts`                                                | Auth specific logic                              |

## CONVENTIONS

- **Redux hooks pattern**: Use `useAuth()`, `useInventory()`, etc. from `src/store/hooks.ts` - NOT Context providers
- **Uncontrolled inputs**: Bottom sheet forms use `defaultValue` + refs for IME composition (Chinese Pinyin support)
- **Top-level BottomSheetModal styling**: ALWAYS set `backgroundStyle={{ backgroundColor: theme.colors.background }}` and use rounded `ContentContainer` for dark mode support
- **API client**: ALWAYS get from `useAuth().getApiClient()` - never `new ApiClient()`
- **Styled-components**: Inject theme via `({ theme }: StyledProps) => ...`
- **Saga pattern**: Domain sagas in `src/store/sagas/`, watchers use `takeLatest`, access API client via `select()`
- **Selector pattern**: Memoized with `createSelector` (inventorySlice, todoSlice)
- **OAuth client IDs**: Use iOS/Android client IDs (NOT Web) with custom scheme `com.cluttrapp.cluttr://`
- **Firebase keys**: Never commit `GoogleService-Info.plist` or `google-services.json` (gitignored).
- **Firebase SDK**: Version-locked (currently `^23.x.x` for `@react-native-firebase/*`).

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** manually initialize ApiClient in components - use `useAuth().getApiClient()`
- **NEVER** use controlled inputs (`value` prop) in bottom sheet modals - breaks IME composition
- **NEVER** use Web OAuth client IDs for authentication - only iOS (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`) and Android (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`). *Note: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is used for Firebase Auth configuration only.*
- **NEVER** use `console.log()` - use Logger from `src/utils/Logger.ts`
- **NEVER** suppress type errors with `as any` or `@ts-ignore`
- **ALWAYS** run `npm run lint` after edits (enforced by `.cursor/rules/eslint-ensure.mdc`)

## UNIQUE STYLES

- **Dual-state IME pattern**: Store form values in refs (update on `onChangeText`), sync to state on blur/submit, reset with `key` prop
- **Non-serializable Redux**: ApiClient instance, SyncService instance, callback Sets stored in state (explicitly ignored in serializableCheck)
- **Optimistic updates**: Inventory/todo sagas update state before API call, refresh silently on success/failure
- **Callback suppression dance**: `syncCallbackRegistry.setSuppressCallbacks(true)` during sync operations to prevent cascading updates
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

## NOTES

- **SyncService is largest file** (1234 lines) - god object handling queue, merge, cleanup; consider extraction
- **Bottom sheets duplicate** ~80% code between CreateItem and EditItemBottomSheet - extract to generic component
- **No testing infrastructure** - no test files or Jest config
- **Build artifacts committed** - build-_.tar.gz, build-_.ipa in root should be gitignored
- **Empty src/contexts/** - Redux hooks replaced Context, remove this directory
- **IME composition critical** - Chinese input requires uncontrolled pattern to prevent keyboard reset on each keystroke
