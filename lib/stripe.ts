export const stripePlans = {
  free: {
    name: "Free",
    price: "$0",
    description: "For quick checks when you are just trying Skaren.",
    features: ["5 product scans per month", "Basic A-E health grade", "Key nutrition highlights", "Manual barcode entry", "Guest scanning"]
  },
  premium: {
    name: "Support Skaren",
    price: "50 kr+",
    description: "Choose a one-time support amount and help keep Skaren independent.",
    features: ["Supporter or Founder badge", "Unlimited scans", "Full scan history", "Deeper ingredient insights", "Vote on future improvements"]
  }
};

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
