import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decodeSession, homeFor } from "@/lib/session-core";

const AUTH_PAGES = ["/signin", "/signup"];

/** Optimistic routing only. Real authorization happens in Spring on every API call. */
export function proxy(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (AUTH_PAGES.includes(pathname)) {
    return session ? NextResponse.redirect(new URL(homeFor(session.role), request.url)) : NextResponse.next();
  }
  if (!session) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/signin", "/signup", "/dashboard/:path*", "/donations/:path*", "/discover/:path*", "/pickups/:path*", "/admin/:path*", "/profile/:path*", "/requests/:path*"],
};
