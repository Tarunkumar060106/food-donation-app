import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, SESSION_COOKIE } from "@/lib/session";

// Credentials must go through /api/session so the token lands in the httpOnly cookie, not in page JS.
const BLOCKED = new Set(["auth/login", "auth/register"]);
const PASS_THROUGH_HEADERS = ["content-type", "cache-control"];

async function forward(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const joined = path.map(encodeURIComponent).join("/");
  if (BLOCKED.has(joined)) {
    return NextResponse.json({ status: 404, title: "Not found" }, { status: 404 });
  }

  const mutating = request.method !== "GET" && request.method !== "HEAD";
  const origin = request.headers.get("origin");
  if (mutating && origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ status: 403, title: "Forbidden", detail: "Cross-site request blocked." }, { status: 403 });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const headers = new Headers({ Accept: request.headers.get("accept") ?? "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/api/${joined}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: mutating ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return NextResponse.json(
      { status: 503, title: "Service unavailable", detail: "The FoodRescue server is not reachable. Try again in a moment." },
      { status: 503 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of PASS_THROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  if (upstream.headers.get("content-type")?.startsWith("text/event-stream")) {
    responseHeaders.set("Cache-Control", "no-cache, no-transform");
    responseHeaders.set("X-Accel-Buffering", "no");
  }

  const response = new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  if (upstream.status === 401 && token) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export { forward as GET, forward as POST, forward as PATCH, forward as DELETE };
