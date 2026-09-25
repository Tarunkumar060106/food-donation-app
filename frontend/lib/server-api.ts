import { redirect } from "next/navigation";
import { BACKEND_URL, getToken } from "./session";
import type { Problem } from "./types";

export class ApiError extends Error {
  constructor(public problem: Problem) {
    super(problem.detail ?? problem.title ?? `Request failed (${problem.status})`);
  }
}

/** Server-component fetch to Spring with the session token. A rejected token clears the session. */
export async function serverApi<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/api/session/logout?next=/signin");
  if (!res.ok) {
    const problem = (await res.json().catch(() => ({}))) as Partial<Problem>;
    throw new ApiError({ status: res.status, ...problem });
  }
  return res.json() as Promise<T>;
}
