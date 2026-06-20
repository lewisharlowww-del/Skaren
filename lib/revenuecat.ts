import { Capacitor } from "@capacitor/core";
import { LOG_LEVEL, Purchases } from "@revenuecat/purchases-capacitor";
import type { PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor";

export const RC_API_KEY = "appl_mNwJQsfrHPNWcVlkdEuJKIqjORJ";
const SUBSCRIPTION_UNAVAILABLE_ERROR = "Subscriptions are temporarily unavailable. Please try again in a moment.";
const PRODUCT_IDS = {
  monthly: "no.skaren.app.premium.monthly",
  yearly: "no.skaren.app.premium.yearly",
} as const;

let configured = false;
let activeUserId: string | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY DEBUG — REMOVE AFTER ON-DEVICE SIGN-IN/SIGN-OUT VERIFICATION
// Logs RevenueCat's current app_user_id so we can visually confirm it switches
// to the Supabase UID on login and back to an anonymous $RCAnonymousID on logout.
// Delete this helper and its two call sites (initRevenueCat, logoutRevenueCat)
// once verified. Search marker: RC_DEBUG_APP_USER_ID
async function debugLogRevenueCatAppUserId(context: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { appUserID } = await Purchases.getAppUserID();
    // eslint-disable-next-line no-console
    console.log(`[RC_DEBUG_APP_USER_ID] ${context}: appUserID=${appUserID}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`[RC_DEBUG_APP_USER_ID] ${context}: getAppUserID failed`, error);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

/** Call once on app mount (no userId needed). */
export async function configurePurchases() {
  if (!Capacitor.isNativePlatform()) return;
  if (configured) return;
  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({ apiKey: RC_API_KEY });
  configured = true;
}

export async function initRevenueCat(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  if (!configured) {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey: RC_API_KEY });
    configured = true;
  }

  if (activeUserId !== userId) {
    await Purchases.logIn({ appUserID: userId });
    activeUserId = userId;
    await debugLogRevenueCatAppUserId("after logIn"); // RC_DEBUG_APP_USER_ID — remove after verification
  }
}

/**
 * Resets RevenueCat back to a fresh anonymous app_user_id. Call this on sign-out
 * so the previous Supabase user's entitlements are no longer reported on a shared
 * device, and so the next sign-in re-aliases cleanly.
 *
 * Safe to call unconditionally: it no-ops on web and when RC was never configured,
 * and swallows the "called logOut but the current user is anonymous" error that
 * the SDK throws when there is nothing to reset.
 */
export async function logoutRevenueCat() {
  if (!Capacitor.isNativePlatform()) return;
  if (!configured) {
    activeUserId = null;
    return;
  }

  try {
    await Purchases.logOut();
  } catch (error) {
    logRevenueCatDiagnostic("logOut failed (likely already anonymous)", error);
  } finally {
    activeUserId = null;
    await debugLogRevenueCatAppUserId("after logOut"); // RC_DEBUG_APP_USER_ID — remove after verification
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active["Skaren Pro"] !== undefined;
  } catch {
    return false;
  }
}

type SubscriptionPlan = keyof typeof PRODUCT_IDS;

function logRevenueCatDiagnostic(label: string, details: unknown) {
  if (typeof console === "undefined") return;
  console.warn(`[RevenueCat][Skaren] ${label}`, details);
}

function summarizeOffering(offering: PurchasesOffering | null) {
  if (!offering) return null;

  return {
    monthly: offering.monthly
      ? {
          identifier: offering.monthly.identifier,
          packageType: offering.monthly.packageType,
          productIdentifier: offering.monthly.product?.identifier,
        }
      : null,
    annual: offering.annual
      ? {
          identifier: offering.annual.identifier,
          packageType: offering.annual.packageType,
          productIdentifier: offering.annual.product?.identifier,
        }
      : null,
    availablePackages: offering.availablePackages.map((aPackage) => ({
      identifier: aPackage.identifier,
      packageType: aPackage.packageType,
      productIdentifier: aPackage.product?.identifier,
    })),
  };
}

function matchesPackage(aPackage: PurchasesPackage, plan: SubscriptionPlan) {
  const identifier = aPackage.identifier.toLowerCase();
  const packageType = String(aPackage.packageType).toUpperCase();
  const productIdentifier = aPackage.product?.identifier?.toLowerCase() ?? "";
  const expectedProductId = PRODUCT_IDS[plan];

  if (productIdentifier === expectedProductId) return true;

  if (plan === "monthly") {
    return packageType === "MONTHLY" || identifier === "$rc_monthly" || identifier.includes("monthly");
  }

  return (
    packageType === "ANNUAL" ||
    identifier === "$rc_annual" ||
    identifier.includes("annual") ||
    identifier.includes("yearly")
  );
}

function findSubscriptionPackage(offering: PurchasesOffering | null, plan: SubscriptionPlan) {
  if (!offering) return null;

  const standardPackage = plan === "monthly" ? offering.monthly : offering.annual;
  if (standardPackage) return standardPackage;

  return offering.availablePackages.find((aPackage) => matchesPackage(aPackage, plan)) ?? null;
}

export interface SubscriptionTrial {
  /** ISO 8601 unit for the trial period: DAY, WEEK, MONTH or YEAR. */
  periodUnit: string;
  /** Number of units in the trial period (e.g. 7 for a 7-day trial). */
  periodNumberOfUnits: number;
  /** Number of billing cycles the intro offer applies to. */
  cycles: number;
  /** True when the introductory offer is a free trial (intro price is 0). */
  isFree: boolean;
  /** Localized price of the intro offer (empty string for free trials on some stores). */
  priceString: string;
}

export interface SubscriptionPlanInfo {
  plan: SubscriptionPlan;
  productId: string;
  /** Localized, store-formatted price including currency, e.g. "kr 490,00". */
  priceString: string;
  /** Localized price normalized to a monthly recurrence (null for monthly plans / unavailable). */
  pricePerMonthString: string | null;
  /** Introductory offer (free trial or intro price) as configured in App Store Connect, if any. */
  trial: SubscriptionTrial | null;
}

export interface SubscriptionPlans {
  monthly: SubscriptionPlanInfo | null;
  yearly: SubscriptionPlanInfo | null;
}

function describePlan(aPackage: PurchasesPackage | null, plan: SubscriptionPlan): SubscriptionPlanInfo | null {
  if (!aPackage) return null;

  const product = aPackage.product;
  if (!product) return null;

  const intro = product.introPrice ?? null;
  const trial: SubscriptionTrial | null = intro
    ? {
        periodUnit: String(intro.periodUnit ?? ""),
        periodNumberOfUnits: Number(intro.periodNumberOfUnits ?? 0),
        cycles: Number(intro.cycles ?? 0),
        isFree: Number(intro.price ?? 0) === 0,
        priceString: String(intro.priceString ?? ""),
      }
    : null;

  return {
    plan,
    productId: product.identifier ?? PRODUCT_IDS[plan],
    priceString: product.priceString ?? "",
    pricePerMonthString: product.pricePerMonthString ?? null,
    trial,
  };
}

/**
 * Loads the live subscription pricing/intro-offer details from the current RevenueCat
 * offering. Returns null on non-native platforms (web/Vercel) so callers can fall back
 * to marketing copy. The returned prices/trials are exactly what StoreKit reports, so the
 * UI always matches the App Store Connect configuration.
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlans | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!configured) await configurePurchases();

  const offerings = await Purchases.getOfferings();
  logRevenueCatDiagnostic("Offerings loaded for plan display", {
    current: summarizeOffering(offerings.current),
    allKeys: Object.keys(offerings.all ?? {}),
  });

  return {
    monthly: describePlan(findSubscriptionPackage(offerings.current, "monthly"), "monthly"),
    yearly: describePlan(findSubscriptionPackage(offerings.current, "yearly"), "yearly"),
  };
}

export async function purchaseMonthly() {
  if (!Capacitor.isNativePlatform()) {
    logRevenueCatDiagnostic("Purchase blocked: not running on native platform", {
      platform: Capacitor.getPlatform(),
      isNativePlatform: Capacitor.isNativePlatform(),
    });
    throw new Error("Not on native platform");
  }
  if (!configured) await configurePurchases();
  const offerings = await Purchases.getOfferings();
  logRevenueCatDiagnostic("Offerings loaded for monthly purchase", {
    current: summarizeOffering(offerings.current),
    allKeys: Object.keys(offerings.all ?? {}),
  });
  const monthly = findSubscriptionPackage(offerings.current, "monthly");
  if (!monthly) throw new Error(SUBSCRIPTION_UNAVAILABLE_ERROR);
  return Purchases.purchasePackage({ aPackage: monthly });
}

export async function purchaseYearly() {
  if (!Capacitor.isNativePlatform()) {
    logRevenueCatDiagnostic("Purchase blocked: not running on native platform", {
      platform: Capacitor.getPlatform(),
      isNativePlatform: Capacitor.isNativePlatform(),
    });
    throw new Error("Not on native platform");
  }
  if (!configured) await configurePurchases();
  const offerings = await Purchases.getOfferings();
  logRevenueCatDiagnostic("Offerings loaded for yearly purchase", {
    current: summarizeOffering(offerings.current),
    allKeys: Object.keys(offerings.all ?? {}),
  });
  const annual = findSubscriptionPackage(offerings.current, "yearly");
  if (!annual) throw new Error(SUBSCRIPTION_UNAVAILABLE_ERROR);
  return Purchases.purchasePackage({ aPackage: annual });
}

export async function restorePurchases() {
  if (!configured) await configurePurchases();
  return Purchases.restorePurchases();
}
