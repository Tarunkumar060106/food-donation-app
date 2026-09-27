import { NextResponse } from "next/server";
import { BACKEND_URL, SESSION_COOKIE, homeFor, sessionCookieOptions } from "@/lib/session";
import type { User } from "@/lib/types";

/**
 * Exchanges credentials with Spring and keeps the JWT in an httpOnly cookie.
 * The browser only ever receives the user profile, never the token.
 * `me` (profile update) sends the current token and swaps in the fresh one Spring returns.
 */
export async function startSession(action: "login" | "register" | "phone" | "me", request: Request, currentToken?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/api/auth/${action}`, {
      method: action === "me" ? "PUT" : "POST",
      headers,
      body: await request.text(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { status: 503, title: "Service unavailable", detail: "The FoodRescue server is not reachable. Try again in a moment." },
      { status: 503 },
    );
  }

  const body = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(body, { status: upstream.status });
  }

  const { token, expiresAt, user } = body as { token: string; expiresAt: string; user: User };
  const response = NextResponse.json({ user, redirectTo: homeFor(user.role) }, { status: upstream.status });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return response;
}
