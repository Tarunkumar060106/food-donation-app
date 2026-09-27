import type { Problem } from "./types";

export class ApiError extends Error {
  constructor(public problem: Problem) {
    super(problem.detail ?? problem.title ?? `Request failed (${problem.status})`);
  }
  get fieldErrors() {
    return this.problem.errors ?? {};
  }
}

async function parse<T>(res: Response): Promise<T> {
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError({ status: res.status, ...(body ?? {}) });
  }
  return body as T;
}

/** Browser-side calls to Spring, relayed by /api/backend so the session cookie stays httpOnly. */
export async function api<T>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: init?.signal,
  });
  return parse<T>(res);
}

/** Multipart upload through the same relay. The browser sets the multipart boundary itself. */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`/api/backend${path}`, { method: "POST", body: form });
  return parse<T>(res);
}

/** Calls that return a new token go through /api/session so it lands in the httpOnly cookie. */
export async function session<T>(action: "login" | "signup" | "logout" | "phone" | "profile", body?: unknown): Promise<T> {
  const res = await fetch(`/api/session/${action}`, {
    method: action === "profile" ? "PUT" : "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError({ status: res.status, ...(data ?? {}) });
  return data as T;
}
