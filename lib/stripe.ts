// Stripe has been removed from Skaren.
// This stub prevents TypeScript errors from any orphaned references.

export type StripePlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
};

export const stripePlans: Record<string, StripePlan> = {};

export function isStripeConfigured(): boolean {
  return false;
}
