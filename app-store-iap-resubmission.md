# Skaren — IAP Resubmission Checklist

Reference for clearing the **"Developer Action Needed"** status on the premium
subscriptions and resubmitting for review.

## Products

| Plan    | Product ID                         | Marketing price | Trial         |
| ------- | ---------------------------------- | --------------- | ------------- |
| Monthly | `no.skaren.app.premium.monthly`    | 49 kr / mo      | 7 days free   |
| Yearly  | `no.skaren.app.premium.yearly`     | 490 kr / yr     | 7 days free   |

- RevenueCat entitlement: **`Skaren Pro`** (must match the dashboard exactly —
  the app reads `customerInfo.entitlements.active["Skaren Pro"]`).
- RevenueCat public API key (iOS): `appl_mNwJQsfrHPNWcVlkdEuJKIqjORJ`.
- Bundle ID: `no.skaren.app`.

> The pricing UI now reads price, per-month figure, trial badge and CTA from the
> live StoreKit offering (`product.priceString`, `pricePerMonthString`,
> `introPrice`). The hardcoded values above are only fallbacks for web/Vercel and
> the pre-load frame. Whatever is configured in App Store Connect is what the user
> sees — so the table above must match the store, not the other way around.

---

## Why "Developer Action Needed" happens

A never-approved IAP shows this status when it has not been completed/attached for
review. It is an **App Store Connect configuration** state, not a code bug. Work
through every item below before resubmitting.

---

## 1. Agreements, Tax, and Banking

- [ ] **Paid Apps agreement** shows **Active** (not "Pending" / "Expired").
- [ ] Bank account and tax forms completed for the team. Products cannot be
      reviewed or sold while this is incomplete.

## 2. Per-product metadata (each of the 2 subscriptions)

For both `...premium.monthly` and `...premium.yearly`:

- [ ] **Reference Name** set.
- [ ] **Price** / price tier selected (NOK; should equate to ~49 kr / ~490 kr).
- [ ] **Localized display name + description** for every app locale (at minimum
      Norwegian and English to match the app).
- [ ] **Review screenshot** uploaded (a screenshot of the in-app paywall —
      `/pricing`). Required; missing it is a classic Developer Action Needed.
- [ ] **Review notes** if anything about the flow needs explaining.
- [ ] Status moves from "Missing Metadata" → **"Ready to Submit"**.

## 3. Subscription group

- [ ] Both products live in **one subscription group** (e.g. "Skaren Premium")
      so monthly ↔ yearly is a proper upgrade/downgrade, not two unrelated subs.
- [ ] Group has a localized display name + ranking (yearly typically ranked
      above monthly).

## 4. Introductory (free trial) offer

The paywall advertises "7 days free". That trial must actually exist, or Apple
rejects for misleading metadata (Guideline 2.3.1 / 3.1.2).

- [ ] Each product has a **7-day free Introductory Offer** configured.
- [ ] If you decide NOT to offer a trial: that's fine — the app now hides the
      trial badge/subtitle and shows "Subscribe" automatically when
      `introPrice` is absent. No code change needed, just leave the offer off.

## 5. Attach to the app version

This is the single most common cause for a first IAP submission.

- [ ] Open the **app version** being submitted → **In-App Purchases / Subscriptions**
      section → add **both** subscriptions to the version.
- [ ] Submit the binary **and** the IAPs together in the same review.

## 6. Build / binary

- [ ] `CURRENT_PROJECT_VERSION` bumped (currently **8**) and a fresh build
      uploaded that contains the IAP UI.
- [ ] StoreKit framework linked and **In-App Purchase capability** enabled
      (already present in `App.xcodeproj`).
- [ ] App loads `https://skaren.app` (remote Capacitor URL) — confirm the
      deployed site has the latest `/pricing` so the reviewer sees the paywall.

## 7. Paywall compliance (Guideline 3.1.2)

The `/pricing` screen must clearly show, before purchase:

- [x] Title / length of subscription (per month / per year). ✔ in UI
- [x] Price (and trial terms when a trial exists). ✔ now from StoreKit
- [x] Links to **Terms of Use (EULA)** and **Privacy Policy**. ✔ in footer
- [x] Auto-renew disclosure ("Subscriptions renew automatically…"). ✔ in footer
- [ ] **Terms of Use URL** also filled in the App Store Connect **App Information**
      (Apple checks for the EULA link in metadata, not just in-app).
- [ ] **Privacy Policy URL** filled in App Information.
- [ ] **Restore purchases** is reachable (✔ button present on the paywall).

---

## Sandbox verification before resubmit

- [ ] Sign into a **Sandbox Apple ID** on a real device (Settings → Developer, or
      sign in at purchase time). Simulator cannot complete StoreKit purchases.
- [ ] Open `/pricing`. Confirm the price + "7 days free" badge render from
      StoreKit (check the `[RevenueCat][Skaren] Offerings loaded for plan display`
      console log — `summarizeOffering` prints the product IDs that resolved).
- [ ] Complete a sandbox purchase → toast shows "Skaren Pro is now active!" and
      `entitlements.active["Skaren Pro"]` is set.
- [ ] Kill + relaunch → premium persists (`checkPremiumStatus` / `getUserPremiumStatus`).
- [ ] **Restore purchase** on a second install restores entitlement.
- [ ] Confirm `profiles.is_premium` mirrors to `true` in Supabase after purchase.

---

## Quick triage if offerings come back empty

If the paywall shows the fallback price and "Subscriptions are temporarily
unavailable" on purchase, `getOfferings()` returned nothing. Check in order:

1. Products still "Missing Metadata" / not "Ready to Submit" → finish §2.
2. Paid Apps agreement not Active → §1.
3. Product IDs in RevenueCat don't match `no.skaren.app.premium.{monthly,yearly}`.
4. RevenueCat **Offering** not marked **current**, or packages not attached to it.
5. Entitlement name in RevenueCat ≠ `Skaren Pro`.
6. Tested on Simulator instead of a real device with a Sandbox account.

### Reading the device log

The `getOfferings()` result is logged on every purchase attempt. Match the
symptom:

| Log on device                                              | Meaning                                                  | Fix |
| ---------------------------------------------------------- | -------------------------------------------------------- | --- |
| `{"current":null,"allKeys":[]}`                            | RevenueCat returned **no Offerings at all**              | Dashboard config (see below) |
| `current` set but `availablePackages` empty / no `productIdentifier` | Offering exists but products not attached / not approved | §2 + attach packages to the Offering |
| `current` populated with `productIdentifier` values        | Offerings OK; failure is StoreKit/sandbox                | Use a real device + Sandbox Apple ID (§Sandbox) |

> The `Purchase failed {}` that follows an empty offering is **expected**: it's
> our own `SUBSCRIPTION_UNAVAILABLE_ERROR` throw (the bridge serializes the
> `Error` as `{}`), not a native crash.

### Observed: `{"current":null,"allKeys":[]}` (empty offerings on device)

A completely empty `all: {}` means the **RevenueCat backend has no current
Offering** for this app — it is *not* the "products pending review" case. This is
purely a RevenueCat dashboard fix, no app code or new build required:

- [ ] **Products** tab → create both product IDs
      (`no.skaren.app.premium.monthly`, `...yearly`), importing from App Store
      Connect.
- [ ] **Entitlements** → create/confirm **`Skaren Pro`** and attach both products.
- [ ] **Offerings** → create an Offering and **mark it Current (default)**.
      Add a **Monthly** package → monthly product and an **Annual** package →
      yearly product.
- [ ] Confirm this build's API key `appl_mNwJQsfrHPNWcVlkdEuJKIqjORJ` belongs to
      the RC project whose App Store app is `no.skaren.app` (key/app mismatch also
      yields empty offerings).
- [ ] Relaunch the app, open `/pricing`, trigger a purchase, and verify the log
      now shows `current` populated with the `productIdentifier`s before testing a
      real Sandbox purchase.
