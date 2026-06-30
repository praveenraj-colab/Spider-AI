import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ACCESS_COOKIE = "spider_access";
const REFRESH_COOKIE = "spider_refresh";
const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
};

export function backendUrl(path: string): string {
  const baseUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}/api/v1${normalized}`;
}

export async function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  const accessTokenMaxAge = tokens.expires_in ?? DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS;
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, tokens.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: accessTokenMaxAge
  });
  cookieStore.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30
  });
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: accessTokenMaxAge
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

export async function fetchCurrentUser(accessToken: string): Promise<unknown> {
  const userResponse = await fetch(backendUrl("/users/me"), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  if (!userResponse.ok) {
    throw new Error("Unable to load authenticated user.");
  }

  return userResponse.json();
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

  const tokens = (await backendResponse.json()) as AuthTokens;
  let user: unknown;
  try {
    user = await fetchCurrentUser(tokens.access_token);
  } catch {
    const response = NextResponse.json({ error: { message: "Session expired." } }, { status: 401 });
    clearAuthCookies(response);
    return { ok: false, response };
  }

  const response = NextResponse.json({ user });
  await setAuthCookies(response, tokens);
  return { ok: true, user, response };
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
