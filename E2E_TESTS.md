# E2E TEST PLAYBOOK (DEV HARNESS)

End-to-end Critical User Journeys (CUJs) and test cases for Cluttr, executable by an agent via
`scripts/harness.sh` against the **live Firebase backend** (project `cluttr-app-f3c18`:
Auth + Firestore + Storage — there is no custom server).

**Last validated:** 2026-06-11 (full pass after the Firebase migration), iPhone 16 Pro simulator.

---

## 1. PREREQUISITES

| Requirement | Check |
|---|---|
| Dev client installed & Metro healthy | `./scripts/harness.sh doctor` |
| App boots | `./scripts/harness.sh up` (auto-boots sim, starts Metro, launches app) |
| Firebase CLI authed (only needed for admin verification/mutation steps) | `firebase projects:list` shows `cluttr-app-f3c18 (current)` |
| Firestore rules deployed | `firebase deploy --only firestore` (rules live in `firestore.rules`) |
| Storage rules deployed | `firebase deploy --only storage` |
| Native deps unchanged since last build | If `package.json` native deps or `app.json` plugins changed: `./scripts/harness.sh build` (slow) |

**Test accounts** (Firebase email/password — also documented in AGENTS.md):

| | Email | Password | Notes |
|---|---|---|---|
| **A (primary)** | `juncapersonal+cluttr-ai-test@gmail.com` | `Cluttr-AI-e16c71d6e9f2` | UID `LhiZ0HUZIIYL4NdA56Ce55jt4Wo1`, nickname "Cluttr Tester", owner of "My Home" |
| **B (member)** | `juncapersonal+cluttr-ai-test2@gmail.com` | `Cluttr-AI-e16c71d6e9f2` | Nickname "Tester Two", member of A's home + owns its own "My Home" |

---

## 2. HARNESS OPERATION GUIDE (READ BEFORE RUNNING ANYTHING)

### 2.1 Command cheat sheet

```bash
./scripts/harness.sh up                    # boot everything
./scripts/harness.sh reload               # full JS reload (resets in-memory state; session persists)
./scripts/harness.sh screenshot <name>     # PNG → .harness/screenshots/<name>.png (then Read the file)
./scripts/harness.sh ui                    # accessibility tree JSON (frames are in POINTS)
./scripts/harness.sh logs -n 40            # tail Metro log (app Logger output)
./scripts/harness.sh tap --label "Notes"   # tap by accessibility label (works for tab bar etc.)
./scripts/harness.sh tap -x 200 -y 400     # tap by POINT coordinates
./scripts/harness.sh type 'text'           # type into the FOCUSED field (tap a field first)
./scripts/harness.sh key 42                # HID key: 42=backspace, 40=return
./scripts/harness.sh swipe --start-x 200 --start-y 700 --end-x 200 --end-y 450   # scroll up
xcrun simctl openurl booted "com.cluttrapp.cluttr://?inviteCode=<CODE>"          # deep link
```

### 2.2 Coordinate math (CRITICAL)

- The simulator screen is **402 × 874 points** (iPhone 16 Pro).
- `ui` frames are already in points — use them directly when an element is in the tree.
- Screenshot PNGs are larger than the point grid. To convert a pixel position measured on a
  screenshot to tap points: `point = displayed_px × (402 / png_display_width)`.
  (E.g. for a 603-px-wide render the factor is ≈ 0.667; for a 301-px-wide render ≈ 1.336.)
  **Always compute the factor from the actual image width — do not assume.**
- Re-screenshot after every navigation; never tap from a stale screenshot.

### 2.3 Hard-won gotchas

1. **Bottom-sheet contents are often MISSING from the `ui` tree** (e.g. the Add New Item sheet
   shows the tab bar behind it instead). When that happens, derive tap points from screenshots.
2. **`type` can double-fire.** If a `type` call produces no output line, do NOT retry blindly —
   screenshot/`ui` first to check the field value. If text got duplicated, `reload` and redo the
   form (fastest), or clear the field (see 4).
3. **RN TextInput placeholders appear as the field's `AXValue`** — a field "containing" its
   placeholder text is actually empty.
4. **Uncontrolled inputs with `defaultValue`** (nickname setup): typing inserts at the cursor
   *inside* the default text. To replace: tap the right end of the field, then
   `for i in $(seq 1 50); do ./scripts/harness.sh key 42 >/dev/null 2>&1; done`, then `type`.
5. **System dialogs (notifications, Save Password, photo permission) are NOT in the app AX tree.**
   Tap them by screenshot coordinates. Standard two-button alert: buttons sit ≈ 60% of width
   apart; compute from the screenshot.
6. **Validation can silently disable buttons** — the Add-Item "Add to Home" button is disabled
   until name AND location are set. If a tap "does nothing", check form validity first.
7. **Stray typing with no focused field can open the Expo dev menu** — close via `tap --label "Close"`.
8. **Expected log noise:** RNFB "namespaced API deprecated" WARNs are pre-existing; ignore them.
   Grep with `grep -viE "deprecat"` to filter.

### 2.4 Reading results

For every test case, verify through up to three lenses:
- **UI**: `screenshot` + Read the PNG.
- **Logs**: `./scripts/harness.sh logs -n 40 | grep -viE "deprecat"` — look for
  `[SAGA]`/`[AUTH]` lines and the absence of `permission-denied` (except where expected).
- **Firestore (admin)**: see §3 — authoritative for "did the write actually commit".

---

## 3. ADMIN ACCESS (FIRESTORE REST VIA FIREBASE CLI TOKEN)

The Firebase CLI's stored OAuth credentials grant project-owner access to the Firestore REST API
(IAM access — **security rules do not apply**, so this is for verification and for simulating
"another user/device", not for testing rules). Template:

```bash
node -e "
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/configstore/firebase-tools.json', 'utf8'));
fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',   // public Firebase CLI OAuth client
    refresh_token: cfg.tokens.refresh_token,
    grant_type: 'refresh_token',
  }),
}).then(r => r.json()).then(async (tok) => {
  const base = 'https://firestore.googleapis.com/v1/projects/cluttr-app-f3c18/databases/(default)/documents';
  const h = { Authorization: 'Bearer ' + tok.access_token, 'Content-Type': 'application/json' };
  // --- replace below with the GET/PATCH/DELETE you need ---
  const res = await fetch(base + '/homes/<HOME_ID>', { headers: h });
  console.log(res.status, JSON.stringify(await res.json(), null, 1).slice(0, 800));
});
"
```

Common operations:
- **Read a doc**: `GET {base}/homes/{homeId}` or `.../homes/{homeId}/inventory/{itemId}`
- **List a collection**: `GET {base}/homes/{homeId}/inventory`
- **Patch one field** (used for real-time tests):
  `PATCH {base}/.../{doc}?updateMask.fieldPaths=name` with body
  `{"fields":{"name":{"stringValue":"New Name"}}}`
- **Delete a doc**: `DELETE {base}/.../{doc}`

Firestore schema (full details in AGENTS.md → FIREBASE):
```
users/{uid}                                     invitations/{code}
homes/{homeId}            (members map, memberIds[], settings, invitationCode)
homes/{homeId}/inventory|inventoryCategories|locations|todos|todoCategories/{id}
```

---

## 4. STATE RESET PROCEDURES

| Goal | Procedure |
|---|---|
| Reset in-memory app state | `./scripts/harness.sh reload` (Firebase session persists) |
| Sign out | Avatar (top-right) → Profile → scroll down → "Log Out" → confirm |
| Reset a form mid-test | Close the sheet (X button) and reopen, or `reload` |
| Delete test data created by a run | Admin REST `DELETE` on the docs you created (preferred), or delete via app UI |
| Nuke and re-install app (last resort) | `xcrun simctl uninstall booted com.cluttrapp.cluttr && ./scripts/harness.sh up` — Firebase session is lost; log in again |

**Convention:** prefix names created during automated runs with `E2E-` (e.g. `E2E-Test Item`) so
they're identifiable and safe to clean up. Account A's home contains baseline data
("Paper Towels (LIVE)" item, "Kitchen" location, "Buy milk" todo) — leave it, tests may rely on a
non-empty home.

---

## 5. CRITICAL USER JOURNEYS

Run order matters only where stated. Each test case lists **Pre** (preconditions), **Steps**,
**Expect**, and **Cleanup** when needed.

---

### CUJ-1 — AUTHENTICATION & SESSION

#### TC-1.1 Email/password login
- **Pre:** App on Login screen (if logged in, log out first).
- **Steps:**
  1. `ui` → get TextField frames (email ≈ y 396, password ≈ y 464 in points).
  2. Tap email field → `type 'juncapersonal+cluttr-ai-test@gmail.com'`.
  3. Verify via `ui` that the value is set exactly once (gotcha 2.3.2).
  4. Tap password field → `type 'Cluttr-AI-e16c71d6e9f2'`.
  5. Tap "Log In" (≈ x 200, y 565).
  6. Dismiss "Save Password?" system alert if shown (tap "Not Now").
- **Expect:**
  - Logs: `Firebase user found` is absent (fresh login) but `Homes snapshot: N home(s), fromCache=false` appears; **no** `permission-denied`.
  - UI: main Home screen, "Currently Managing: My Home", item list renders.
- **Failure modes:** error banner on login screen (check logs for `auth/...` codes).

#### TC-1.2 Session restore (cold start / reload)
- **Pre:** Logged in as A.
- **Steps:** `./scripts/harness.sh reload` → wait ~6 s → screenshot.
- **Expect:** Lands on the main screen WITHOUT showing Login. Logs:
  `Firebase user found, restoring session` → `Homes snapshot: ...`.

#### TC-1.3 Wrong password rejected
- **Pre:** Login screen.
- **Steps:** As TC-1.1 but password `wrong-password-123`.
- **Expect:** Stays on Login with an error message; logs show `Login error`. No crash.

#### TC-1.4 Logout
- **Pre:** Logged in.
- **Steps:** Avatar (top-right, ≈ 359, 96) → Profile → swipe up → tap "Log Out" row → confirm "Log Out" in alert.
- **Expect:** Returns to Login screen. Logs: `Clearing auth data`, `Closing homes subscription`.
  Re-`reload` should still show Login (session actually cleared).

#### TC-1.5 Signup (creates real Firebase users — use a fresh `+suffix` email, e.g. `juncapersonal+cluttr-e2e-<timestamp>@gmail.com`)
- **Pre:** Login screen.
- **Steps:**
  1. Tap "Register now" (≈ 271, 633).
  2. Fill nickname (≈ y 369), email (≈ y 438), password (≈ y 506); tap "Create your profile" (≈ 200, 592).
  3. Dismiss system dialogs (notifications → "Don't Allow"; Save Password → "Not Now").
  4. The "Setup Profile" sheet appears with the email prefix as **defaultValue** — clear it per gotcha 2.3.4, type a nickname, tap "Enter my home".
- **Expect:**
  - Logs: `No homes found, creating default home` → next snapshot shows 1 home. No `permission-denied` surviving the retries (a single retried warning `listener permission-denied, retrying` is acceptable; a persisting one is a FAIL).
  - Admin REST: `users/{uid}` doc exists with the email; one `homes/{id}` doc with `ownerId == uid`, `memberIds == [uid]`.
- **Cleanup:** Delete the user in Firebase Console → Authentication (or leave; harmless), and admin-delete its home doc + `users/{uid}` doc.

#### TC-1.6 Password reset email (smoke)
- **Steps:** Login screen → "Forgot your password?" → enter account A email → submit.
- **Expect:** Success toast ("Reset email sent"); no crash. (Email content not verifiable here.)

---

### CUJ-2 — INVENTORY CRUD

#### TC-2.1 Create item (with location dependency)
- **Pre:** Logged in as A, Home tab.
- **Steps:**
  1. Tap FAB `+` (≈ 358, 711) → tap "Manually Add" row (visible label; ≈ 282, 648).
  2. Name field is auto-focused → `type 'E2E-Test Item'`.
  3. **Location is required** (submit is disabled without it). Select existing chip ("Kitchen", ≈ 56, 323) or create one via the `+` under Location (see TC-4.1).
  4. Tap "Add to Home" (≈ 200, 803).
- **Expect:**
  - Sheet closes; item appears in the list **immediately** (latency compensation) — All Items count +1.
  - Logs contain `Item created: id=...` and no errors.
  - Admin REST: doc exists under `homes/{homeId}/inventory` with `name == 'E2E-Test Item'`, ISO-string `createdAt/updatedAt`, `batches` array.
- **Cleanup:** TC-2.4 deletes it.

#### TC-2.2 Edit item fields (debounced write)
- **Pre:** `E2E-Test Item` exists.
- **Steps:**
  1. Tap the item card → ItemDetails screen.
  2. Edit the name (append ` v2`) via the name input.
  3. Wait ≥ 1 s (400 ms debounce + write), then go back.
- **Expect:** List shows updated name; admin REST shows the new `name` and a bumped `updatedAt`.
  Logs: no error; only ONE write should result from a burst of keystrokes (verify by watching
  `updatedAt` change once).

#### TC-2.3 Batches (quantity) update
- **Pre:** On ItemDetails of `E2E-Test Item`.
- **Steps:** Add/edit a batch (quantity +1) via the batch UI.
- **Expect:** UI updates instantly; admin REST: `batches` array reflects the change atomically on the item doc.

#### TC-2.4 Delete item
- **Steps:** From the item's context menu (long-press the card on Home) or ItemDetails → delete → confirm.
- **Expect:** Item disappears immediately; count decrements; admin REST: doc gone.

#### TC-2.5 Filters smoke
- **Steps:** Home tab → "Filter" → filter by location "Kitchen" → screenshot → clear filter.
- **Expect:** Only Kitchen items listed; clearing restores the full list. (Pre-existing nit: cards
  display raw location IDs like `loc-...` for custom locations — NOT a failure.)

---

### CUJ-3 — TODOS

#### TC-3.1 Add todo
- **Pre:** Logged in as A → Notes tab (`tap --label "Notes"`).
- **Steps:** Tap "Add a new todo..." input (≈ 150, 260) → `type 'E2E-Buy eggs'` → `key 40` (return).
- **Expect:** Todo appears under "Pending (n)" immediately; admin REST: doc in `homes/{homeId}/todos` with `completed: false`.

#### TC-3.2 Toggle completion
- **Steps:** Tap the todo's circle checkbox (left edge of the row, ≈ x 40).
- **Expect:** Row moves to "Completed (n)" with strikethrough; doc has `completed: true` and a `completedAt` ISO string. Toggle back → returns to Pending, `completedAt` null.

#### TC-3.3 Edit todo text
- **Steps:** Tap the todo row to open edit → change text → save.
- **Expect:** Updated text in list and in Firestore.

#### TC-3.4 Delete todo
- **Steps:** Swipe/long-press the row → delete.
- **Expect:** Gone from UI and Firestore.

#### TC-3.5 Todo categories smoke
- **Steps:** Via the category UI on Notes (Planning List header area): create category `E2E-Cat`, assign it, then delete the category.
- **Expect:** Category appears/disappears live; docs in `homes/{homeId}/todoCategories` match.

---

### CUJ-4 — LOCATIONS & INVENTORY CATEGORIES

#### TC-4.1 Create location (inline from Add-Item sheet)
- **Steps:** Add-Item sheet → `+` under Location (≈ 56, 306) → "Create Location" sheet → tap name field → `type 'E2E-Garage'` → optionally tap an icon → tap "Create Location" (≈ 200, 803).
- **Expect:** Returns to Add-Item sheet; new chip appears **immediately** (live listener). Admin REST: doc in `homes/{homeId}/locations`.

#### TC-4.2 Inventory category create/delete
- **Steps:** Add-Item sheet → `+` under Category → create `E2E-Cleaning` → verify chip; then delete it via the category management UI (ItemDetails/category selector context menu).
- **Expect:** Live appearance/removal; `homes/{homeId}/inventoryCategories` matches.

---

### CUJ-5 — HOMES (MULTI-HOME, SETTINGS, DELETE)

#### TC-5.1 Create + switch home
- **Steps:** Tap "My Home ˅" header (≈ 75, 104) → "Add New Property" → name `E2E-Home` → submit. Then use the switcher to flip between homes.
- **Expect:** New home selected automatically after creation; switching re-subscribes listeners — logs show fresh snapshots per domain, item list swaps content. **A transient retried permission-denied right after creation is acceptable; a permanent one is a FAIL.**

#### TC-5.2 Edit home name
- **Steps:** Settings tab → "Edit Home" → change name to `E2E-Home v2` → save.
- **Expect:** Header + switcher show the new name (optimistic + snapshot); home doc updated.

#### TC-5.3 Sharing toggles (owner)
- **Steps:** Settings → flip "Item Library" toggle off, then on.
- **Expect:** Success toast each time; home doc `settings.canShareInventory` flips in Firestore. (Member-side effect tested in TC-6.5.)

#### TC-5.4 Delete home (CASCADE — destructive; only ever delete `E2E-` homes!)
- **Pre:** Switched to `E2E-Home v2`; add one item + one todo to it first so the cascade has work.
- **Steps:** Settings → "Delete Home" → confirm.
- **Expect:**
  - App switches to the remaining home; deleted home gone from switcher.
  - Admin REST: home doc gone, AND its `inventory`/`todos` subcollection docs gone (list returns empty), AND its `invitations/{code}` doc gone if one existed.
  - Logs: no permission errors.
- **Note:** This is the least-exercised code path (`HomeService.cascadeDelete`) — watch it closely.

---

### CUJ-6 — SHARING & INVITATIONS (TWO ACCOUNTS)

> Account A owns the shared home; account B is/becomes a member. The full flow requires
> logout/login switches — budget time accordingly.

#### TC-6.1 Invitation code creation (lazy)
- **Pre:** Logged in as A, Settings tab.
- **Steps:** Tap "Invite family members to join" (≈ 200, 315).
- **Expect:** "Invite Members" sheet (QR / Share Link). Admin REST: home doc has `invitationCode`,
  and `invitations/{code}` exists with `homeId`, `ownerNickname`, snapshot `settings` **equal to
  the home's settings** (rules enforce equality).

#### TC-6.2 Validate invitation (non-member preview)
- **Pre:** Logged in as B (any home). Get `<CODE>` from admin REST (`homes/{A's homeId}` → `invitationCode`).
- **Steps:** `xcrun simctl openurl booted "com.cluttrapp.cluttr://?inviteCode=<CODE>"`.
- **Expect:** Invitation sheet shows owner nickname/email and Shared Scope rows — proving a
  non-member can `get` the invitation doc but nothing else.

#### TC-6.3 Accept invitation (rules-only join)
- **Pre:** TC-6.2 sheet is open, B is NOT yet a member (if B is already a member from a previous
  run, first remove B via TC-6.6 or use a fresh account).
- **Steps:** Tap "Accept Home Invitation" (≈ 200, 787).
- **Expect:** Success toast; logs show `Homes snapshot: 2 home(s)` within ~1 s. Switcher lists A's
  home; selecting it shows A's items. Admin REST: A's home doc `members` map now contains B's uid
  with `role: 'member'`, `inviteCode: <CODE>`; `memberIds` includes B.

#### TC-6.4 Invalid code rejected
- **Steps:** Open deep link with code `NOPE12345678`.
- **Expect:** Sheet shows "Invalid invitation code" error state; Close works.

#### TC-6.5 Live permission gating (member)
- **Pre:** B logged in, viewing A's home (Item list visible).
- **Steps:**
  1. Admin REST PATCH A's home: `settings.canShareInventory = false` (keep `canShareTodos: true`) — simulates the owner toggling on another device.
  2. Wait ≤ 6 s → screenshot.
  3. Restore `canShareInventory = true` → wait → screenshot.
- **Expect:** Member's Home tab flips to the lock screen "Access Restricted" **without any user
  action**, then recovers when restored. Logs may show ONE retried permission-denied per toggle;
  the app must NOT switch the member away from the home (it's still in their list) and must NOT
  enter a deny/retry loop (check logs stay quiet after ~10 s).

#### TC-6.6 Owner removes member
- **Pre:** A logged in, Settings tab; B is a member (and ideally B's session is live on A's home to observe the kick).
- **Steps:** Member list → remove "Tester Two" (trash/remove affordance on the member row) → confirm.
- **Expect:** Member disappears from A's list. Admin REST: B's uid gone from `members`/`memberIds`.
  If B's session was active on that home: B's app auto-switches to B's own home (home vanished from
  B's homes snapshot) — toast "Access to this home has been revoked" may appear.
- **Cleanup:** Re-invite B (TC-6.1→6.3) to restore the documented baseline state.

#### TC-6.7 Member leaves home
- **Pre:** B logged in, viewing A's home, member.
- **Steps:** Settings → "Leave Home" → confirm.
- **Expect:** Success toast; B auto-switches to own home; A's home doc no longer lists B.
- **Cleanup:** Re-invite B to restore baseline.

#### TC-6.8 Regenerate invitation code (if UI exposes it)
- **Steps:** As A, regenerate the code from the invite UI.
- **Expect:** Old `invitations/{old}` doc deleted, new one created, home doc `invitationCode`
  updated. Old code now fails TC-6.4-style.

---

### CUJ-7 — REAL-TIME SYNC

#### TC-7.1 External edit appears live
- **Pre:** A logged in, Home tab visible, ≥ 1 item.
- **Steps:**
  1. Admin REST: list `homes/{homeId}/inventory`, pick a doc, PATCH `name` to `<name> (LIVE-<n>)`.
  2. Do NOT touch the app. Wait ≤ 5 s → screenshot.
- **Expect:** The renamed item shows the new name with zero user interaction.
- **Cleanup:** PATCH the name back.

#### TC-7.2 External create/delete appears live
- **Steps:** Admin REST: create a doc in `homes/{homeId}/todos` (fields: `text`, `completed:false`,
  `position:0`, ISO `createdAt`/`updatedAt`) → watch Notes tab; then DELETE it → watch it vanish.
- **Expect:** Appears/disappears live; counts update.

#### TC-7.3 Two-session propagation (gold standard, slower)
- **Steps:** With B logged in on A's home, have A's data changed via admin REST (proxy for A's
  device). Member sees changes live (covered implicitly by TC-6.5/7.1 — run explicitly only for
  release-level verification).

---

### CUJ-8 — PROFILE & AVATAR

#### TC-8.1 Edit nickname
- **Steps:** Avatar → Profile → pencil icon next to name → clear field (gotcha 2.3.4) →
  `type 'Cluttr Tester'` → save.
- **Expect:** Name updates on Profile immediately; `users/{uid}` doc `nickname` updated;
  Settings member list reflects it (may require the home doc to change or a screen revisit).

#### TC-8.2 Avatar upload (Firebase Storage)
- **Pre:** Profile screen.
- **Steps:**
  1. Tap the avatar circle (≈ 200, 263).
  2. Photo permission alert (first run only): tap "Allow Full Access" (bottom-third of dialog).
  3. Picker: tap any photo (e.g. first cell ≈ 71, 258 — recompute scale, this picker renders narrow).
  4. Crop screen: tap "Choose" (bottom-right, ≈ 360, 793).
  5. Wait ≤ 10 s for upload.
- **Expect:** "Avatar updated successfully" alert → OK. Avatar renders the photo. `users/{uid}`
  `avatarUrl` points at `firebasestorage.googleapis.com/...avatars%2F{uid}%2Favatar-<ts>.jpg`.
  Each upload uses a NEW filename (cache busting) — verify the URL changed from the previous one.

---

### CUJ-9 — OFFLINE & RESILIENCE (BEST-EFFORT / PARTIALLY MANUAL)

> There is no reliable per-simulator network kill switch. These tests are OPTIONAL for routine
> runs; execute when network control is available (e.g. disabling the Mac's network with user
> consent) and always restore it.

#### TC-9.1 Offline create (latency compensation)
- **Steps:** Cut network → create an item → it must appear in the list instantly → restore
  network → within ~30 s admin REST shows the doc committed.
- **Expect:** No error toast while offline (writes are fire-and-forget); data syncs on reconnect.

#### TC-9.2 Offline cold start
- **Steps:** Cut network → `reload`.
- **Expect:** Session restores from cache; home + data render from Firestore's local cache
  (`fromCache=true` in homes snapshot log). No crash, no logout.

#### TC-9.3 Listener error resilience (automated proxy)
- Covered by TC-5.1/TC-6.5 retry expectations — a single `listener permission-denied, retrying`
  warning that resolves is PASS; repeated unresolved denials are FAIL.

---

## 6. SMOKE SUITE (RUN THIS FIRST, ~5 MIN)

Minimal pass to confirm the app is alive after any change:

1. `./scripts/harness.sh up` → screenshot → app boots (Login or Home).
2. TC-1.2 session restore (or TC-1.1 login if logged out).
3. TC-2.1 create item → TC-2.4 delete it.
4. TC-3.1 add todo → TC-3.2 toggle → TC-3.4 delete.
5. TC-7.1 external rename appears live (restore the name after).
6. `npm run build && npm run lint` both clean.

Full regression = CUJ-1 through CUJ-8 (CUJ-9 when network control available).

---

## 7. KNOWN ISSUES / NON-FAILURES

| Symptom | Status |
|---|---|
| RNFB "namespaced API deprecated" WARNs flooding logs | Pre-existing; ignore |
| Item cards show raw `loc-...` IDs for custom locations | Pre-existing display nit, not a regression |
| One `listener permission-denied, retrying` right after home creation/invite accept | Expected (server commit race); retried automatically |
| Settings member list shows email until first home-doc change | Minor staleness; refreshes on next home snapshot |
| Signup form's nickname field doesn't pre-populate the Setup Profile sheet | Pre-existing flow quirk |

## 8. REPORTING TEMPLATE

For each run, report:

```
## E2E Run <date> — <git sha> — <suite: smoke|full>
| TC | Result | Evidence | Notes |
|----|--------|----------|-------|
| TC-1.1 | PASS | login-state.png, logs clean | |
| TC-6.5 | FAIL | gated.png | member app stuck on lock after restore |
...
Cleanup performed: <list E2E-* docs removed, toggles restored, accounts left logged in as A>
```

**Always finish a run by:** restoring any flipped sharing toggles, deleting `E2E-*` docs you
created, and leaving account A logged in on its own "My Home".
