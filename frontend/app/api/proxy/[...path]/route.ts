import { NextRequest, NextResponse } from "next/server";

import {
  backendUrl,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies
} from "@/lib/server/backend";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxy(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const path = `/${params.path.join("/")}${request.nextUrl.search}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

  const callBackend = async (accessToken?: string) => {
    const headers: Record<string, string> = {};
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return fetch(backendUrl(path), {
      method: request.method,
      headers,
      body,
      cache: "no-store"
    });
  };

  const accessToken = await getAccessToken();
  let backendResponse = await callBackend(accessToken);

  if (backendResponse.status === 401) {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      const response = NextResponse.json({ error: { message: "Authentication required." } }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const refreshResponse = await fetch(backendUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store"
    });

    if (!refreshResponse.ok) {
      const response = NextResponse.json({ error: { message: "Session expired." } }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const refreshPayload = await refreshResponse.json();
    backendResponse = await callBackend(refreshPayload.tokens.access_token);
    const response = await toNextResponse(backendResponse);
    await setAuthCookies(response, refreshPayload.tokens);
    return response;
  }

  return toNextResponse(backendResponse);
}

async function toNextResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  const body = response.status === 204 ? null : await response.arrayBuffer();
  return new NextResponse(body, {
    status: response.status,
    headers: contentType ? { "Content-Type": contentType } : undefined
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
