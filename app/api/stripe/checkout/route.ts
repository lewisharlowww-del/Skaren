import { NextResponse } from "next/server";

// Stripe checkout has been removed from Skaren.
export async function POST() {
  return NextResponse.json({ error: "Stripe checkout has been removed." }, { status: 410 });
}
