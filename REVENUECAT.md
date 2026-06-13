# RevenueCat Integration

In-app purchases for **Cluttr Pro** via [RevenueCat](https://www.revenuecat.com/docs).
SDK: `react-native-purchases` + `react-native-purchases-ui` (paywalls, Customer Center).

## Architecture

| Piece                                          | Role                                                                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/PurchasesService.ts`             | Singleton wrapper (observer pattern, like HomeService). Configure, identity sync, entitlement checks, purchases, paywall, Customer Center |
| `src/hooks/useSubscription.ts`                 | Live `isPro` / `customerInfo` + purchase actions for components                                                                           |
| `app/_layout.tsx`                              | `purchasesService.configure()` at module scope (earliest possible)                                                                        |
| `src/store/sagas/authSaga.ts`                  | `Purchases.logIn(uid)` on auth, `logOut()` on sign-out (fire-and-forget; never blocks auth)                                               |
| `src/screens/settings/SubscriptionSection.tsx` | Settings UI: upgrade (paywall), restore, status, Manage Subscription (Customer Center)                                                    |

- **Entitlement ID**: `Cluttr Pro` (constant `CLUTTR_PRO_ENTITLEMENT`).
- **App user ID**: the Firebase UID — entitlements follow the account across devices/platforms.
- **Source of truth for "is the user Pro"** is `customerInfo.entitlements.active['Cluttr Pro']`, never product IDs.

Gate a premium feature:

```tsx
const { isPro, presentPaywallIfNeeded } = useSubscription();

const handlePremiumFeature = async () => {
  if (await presentPaywallIfNeeded()) {
    // entitled (already Pro, just purchased, or restored)
  }
};
```

## API keys

`.env` (public SDK keys, inlined at build time — `reload` the harness after changing):

```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=test_…
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=test_…
```

iOS ships the production App Store key (`appl_…`); Android still uses the Test Store key until a `goog_…` key exists. `test_…` keys target the **RevenueCat Test Store**: purchases are simulated, no App Store Connect / Play Console products needed, works in the simulator — see AGENTS.md → DEV HARNESS for the local-testing key-swap workflow (swap to the test key, restore the production key when done).

With the `appl_…` key, offerings stay empty (paywall errors) until App Store products are created in App Store Connect and registered in RevenueCat — the dashboard steps below.

## Dashboard configuration (project `Cluttr`)

1. **Products** (Products → + New): `lifetime` (non-consumable), `yearly` (1-year subscription), `monthly` (1-month subscription). With the Test Store these are defined directly in the dashboard; for production, create them in App Store Connect / Play Console first and import.
2. **Entitlement** (Entitlements → + New): identifier exactly `Cluttr Pro`. Attach all three products.
3. **Offering** (Offerings → `default`): add packages `$rc_monthly` → monthly, `$rc_annual` → yearly, `$rc_lifetime` → lifetime. The SDK reads `offerings.current`, so keep `default` as the current offering.
4. **Paywall** (Paywalls → + New on the `default` offering): design in the visual editor; the app presents it with `RevenueCatUI.presentPaywall[IfNeeded]` — no client code changes needed when the design changes.
5. **Customer Center** (Customer Center tab): enable and configure (cancel flows, promo offers, support email). Presented from Settings → Manage Subscription.

## Plan limits (free vs Pro)

| Limit                | Free               | Cluttr Pro                                   |
| -------------------- | ------------------ | -------------------------------------------- |
| Homes                | 2                  | unlimited                                    |
| Members per home     | 1 (no invitations) | 10 incl. owner (anyone may accept an invite) |
| Inventory items/home | 100                | 5000 soft cap                                |
| To-dos/home          | 100                | 5000 soft cap                                |

- Constants in `src/data/planLimits.ts`; UI gates via `usePlanLimits()` (toast + `presentPaywallIfNeeded` on free limits); backstops in the inventory/todo create sagas.
- **Server enforcement** (`firestore.rules`): member cap on the home doc; item caps validated against `homes/{id}/meta/counters`, which every item create/delete updates ±1 in the same batch (`fireCountedWrite`). Free-tier numbers are client-side only — rules can't see RevenueCat entitlements without a backend, so the rules caps (10 members / 5000 items) protect everyone as the abuse backstop.
- **Support override**: edit `limitOverrides: { inventoryMax, todoMax }` on the home doc from the Firebase console (client writes to that field are denied by rules). Pro clients read it as their effective cap; rules use it in place of the 5000 default.
- **Counter recovery**: if a home's counter ever drifts, recompute from actual doc counts and PATCH `homes/{id}/meta/counters` via console/admin REST (see E2E_TESTS.md §3). Rules gotcha: counters are doubles — RNFB serializes JS numbers (incl. `FieldValue.increment`) as doubles, so rules must never check `is int`.
- **Paywall + RN Modals**: never present the paywall while an RN `Modal` is mid-dismiss (iOS wedges the presentation and leaves an invisible touch-blocking sheet) — delay until the modal teardown completes; see `HomeSwitcher.handleOpenAdd`.

## Native build

`react-native-purchases` contains native code: after installing/upgrading it, rebuild the dev client (`./scripts/harness.sh build` or `make build-ios-local`) — Fast Refresh/`reload` alone yields `new NativeEventEmitter() requires a non-null argument`. `PurchasesService.configure()` fails soft in that case (purchases disabled, app unaffected).

For production iOS builds, enable the **In-App Purchase** capability for the bundle ID (EAS managed credentials add it automatically once the app has IAPs). Android needs no manual permission (`com.android.vending.BILLING` is merged from the library manifest).
