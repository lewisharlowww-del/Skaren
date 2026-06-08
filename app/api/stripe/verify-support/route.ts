import { NextResponse } from "next/server";

// Stripe verify-support has been removed from Skaren.
export async function POST() {
  return NextResponse.json({ error: "Stripe verify-support has been removed." }, { status: 410 });
}
