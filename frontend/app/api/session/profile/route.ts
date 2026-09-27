import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { startSession } from "../start-session";

/** Saves the profile and swaps in the fresh token, which carries the updated display name. */
export async function PUT(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ status: 401, title: "Unauthorized", detail: "Sign in to continue." }, { status: 401 });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ status: 403, title: "Forbidden", detail: "Cross-site request blocked." }, { status: 403 });
  }
  return startSession("me", request, token);
}
