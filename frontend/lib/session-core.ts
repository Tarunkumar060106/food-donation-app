import type { Role, Session } from "./types";

export const SESSION_COOKIE = "fr_session";

export function homeFor(role: Role) {
  void role;
  return "/dashboard";
}

function decodeBase64Url(segment: string) {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Reads the JWT payload for routing and display only. The signature is not checked here:
 * Spring verifies it on every API call, so a forged cookie can reach a page shell but no data.
 */
export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(token.split(".")[1]));
    const expiresAt = Number(payload.exp) * 1000;
    if (!payload.sub || !payload.role || expiresAt <= Date.now()) return null;
    return { userId: payload.sub, role: payload.role, name: payload.name ?? "", expiresAt };
  } catch {
    return null;
  }
}
