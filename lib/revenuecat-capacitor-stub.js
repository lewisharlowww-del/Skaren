// Web stub — @revenuecat/purchases-capacitor only works in native Capacitor apps.
// All functions in lib/revenuecat.ts guard with Capacitor.isNativePlatform(),
// so these stubs are never actually called at runtime.

export const LOG_LEVEL = { DEBUG: "DEBUG", INFO: "INFO", WARN: "WARN", ERROR: "ERROR", VERBOSE: "VERBOSE" };

export const Purchases = {
  setLogLevel: async () => {},
  configure: async () => {},
  logIn: async () => ({ customerInfo: { entitlements: { active: {} } } }),
  logOut: async () => {},
  getCustomerInfo: async () => ({ customerInfo: { entitlements: { active: {} } } }),
  getOfferings: async () => ({ current: null, all: {} }),
  purchasePackage: async () => { throw new Error("Purchases not available on web"); },
  restorePurchases: async () => ({ customerInfo: { entitlements: { active: {} } } }),
};
