import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const SAFE_NEXT = new Set(["/", "/signin"]);

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

/** Used when the server rejects a stored token: clear it, then continue to a fixed safe page. */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const response = NextResponse.redirect(new URL(SAFE_NEXT.has(next) ? next : "/", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
