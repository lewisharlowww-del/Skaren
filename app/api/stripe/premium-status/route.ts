import { NextResponse } from "next/server";

// Stripe premium-status has been removed. Premium is now read from profiles.is_premium.
export async function POST() {
  return NextResponse.json({ error: "Stripe premium-status has been removed." }, { status: 410 });
}
