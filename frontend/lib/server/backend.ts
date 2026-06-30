import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ACCESS_COOKIE = "spider_access";
const REFRESH_COOKIE = "spider_refresh";
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

export function backendUrl(path: string): string {
  const baseUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}/api/v1${normalized}`;
}

export async function setAuthCookies(
  response: NextResponse,
  tokens: { access_token: string; refresh_token: string; expires_in: number }
) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, tokens.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: tokens.expires_in
  });
  cookieStore.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30
  });
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: tokens.expires_in
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function refreshAccessToken(): Promise<{
  ok: boolean;
  user?: unknown;
  response?: NextResponse;
}> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return { ok: false };
  }

  const backendResponse = await fetch(backendUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store"
  });

  if (!backendResponse.ok) {
    const response = NextResponse.json({ error: { message: "Session expired." } }, { status: 401 });
    clearAuthCookies(response);
    return { ok: false, response };
  }

  const payload = await backendResponse.json();
  const response = NextResponse.json({ user: payload.user });
  await setAuthCookies(response, payload.tokens);
  return { ok: true, user: payload.user, response };
}

export async function proxiedBackendFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  return fetch(backendUrl(path), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    cache: "no-store"
  });
}
