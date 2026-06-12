// Type stubs for @revenuecat/purchases-capacitor — used by TypeScript on web/Vercel builds.
// The webpack alias in next.config.mjs maps the real module to the JS stub at runtime.

export declare const LOG_LEVEL: {
  DEBUG: string;
  INFO: string;
  WARN: string;
  ERROR: string;
  VERBOSE: string;
};

export interface CustomerInfo {
  entitlements: {
    active: Record<string, unknown>;
  };
}

export interface RCPackage {
  identifier: string;
  packageType: string;
}

export interface Offerings {
  current: {
    monthly: RCPackage | null;
    annual: RCPackage | null;
  } | null;
  all: Record<string, unknown>;
}

export interface PurchaseResult {
  customerInfo: CustomerInfo;
}

export declare const Purchases: {
  setLogLevel: (options: { level: string }) => Promise<void>;
  configure: (options: { apiKey: string }) => Promise<void>;
  logIn: (options: { appUserID: string }) => Promise<{ customerInfo: CustomerInfo }>;
  logOut: () => Promise<void>;
  getCustomerInfo: () => Promise<{ customerInfo: CustomerInfo }>;
  getOfferings: () => Promise<Offerings>;
  purchasePackage: (options: { aPackage: RCPackage }) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<{ customerInfo: CustomerInfo }>;
};
