import { NextResponse, type NextRequest } from "next/server";

// Auth is handled client-side via useUser() + router.push("/login").
// The Supabase browser client stores sessions in localStorage (not cookies),
// so a server-side cookie check here would always fail and block logged-in users.
export function middleware(request: NextRequest) {
  // Redirect the root URL to /scan at the Edge before app/page.tsx ever renders.
  // Without this, Next.js serialises the redirect() call inside the Suspense
  // boundary created by app/loading.tsx as <!--$!--> in the HTML stream.
  // React interprets that sentinel as a Suspense failure and throws error #419,
  // corrupting internal state and causing all useEffects to fire twice on startup.
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/scan", request.url), 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
