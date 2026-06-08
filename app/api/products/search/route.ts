import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { KassalappSearchError, searchKassalappProducts } from "@/lib/kassalapp";

const minimumQueryLength = 2;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length < minimumQueryLength) {
    return NextResponse.json(
      { error: "Enter at least two characters." },
      { status: 400 }
    );
  }

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Sign in to search products." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { data: userData } = await supabase.auth.getUser(token);

  if (!userData.user) {
    return NextResponse.json({ error: "Sign in to search products." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile?.is_premium) {
    return NextResponse.json(
      { error: "Product search is available with Pro." },
      { status: 403 }
    );
  }

  if (!process.env.KASSALAPP_API_KEY) {
    return NextResponse.json(
      { error: "Product search is not configured yet." },
      { status: 503 }
    );
  }

  let products;

  try {
    products = await searchKassalappProducts(query, 100, {
      includeBrandMatch: true
    });
  } catch (error) {
    const status = error instanceof KassalappSearchError ? error.status : undefined;
    const message =
      status === 401 || status === 403
        ? "Kassalapp rejected the configured API key."
        : status === 429
          ? "Kassalapp search is busy. Try again shortly."
          : "Kassalapp search is unavailable right now.";

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && status
            ? `${message} (${status})`
            : message
      },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { products },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
