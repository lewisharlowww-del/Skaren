import { NextResponse, type NextRequest } from "next/server";

// Auth is handled client-side via useUser() + router.push("/login").
// The Supabase browser client stores sessions in localStorage (not cookies),
// so a server-side cookie check here would always fail and block logged-in users.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: []
};
