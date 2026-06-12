import { Capacitor } from "@capacitor/core";
import { LOG_LEVEL, Purchases } from "@revenuecat/purchases-capacitor";

export const RC_API_KEY = "appl_mNwJQsfrHPNWcVlkdEuJKIqjORJ";

let configured = false;
let activeUserId: string | null = null;

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

export async function purchaseMonthly() {
  const offerings = await Purchases.getOfferings();
  const monthly = offerings.current?.monthly;
  if (!monthly) throw new Error("No monthly package found");
  return Purchases.purchasePackage({ aPackage: monthly });
}

export async function purchaseYearly() {
  const offerings = await Purchases.getOfferings();
  const annual = offerings.current?.annual;
  if (!annual) throw new Error("No yearly package found");
  return Purchases.purchasePackage({ aPackage: annual });
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}
