import { NextResponse } from "next/server";
import { fetchKassalappProduct } from "@/lib/kassalapp";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { barcode?: string };
    const barcode = body.barcode?.trim();

    if (!barcode) {
      return NextResponse.json({ image: null }, { status: 400 });
    }

    const product = await fetchKassalappProduct(barcode).catch(() => null);

    return NextResponse.json({
      image: product?.image ?? null
    });
  } catch {
    return NextResponse.json({ image: null });
  }
}
