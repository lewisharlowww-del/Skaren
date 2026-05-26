import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/history", "/account"];

function hasSupabaseSession(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!isProtectedRoute || hasSupabaseSession(request)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/history/:path*", "/account/:path*"]
};
