import { NextResponse } from "next/server";

// Stripe webhook has been removed from Skaren.
export async function POST() {
  return NextResponse.json({ error: "Stripe webhook has been removed." }, { status: 410 });
}
