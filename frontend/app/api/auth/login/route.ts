import { NextRequest, NextResponse } from "next/server";

import { backendUrl, fetchCurrentUser, setAuthCookies, type AuthTokens } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const backendResponse = await fetch(backendUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const data = await backendResponse.json();
  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const tokens = data as AuthTokens;
  let user: unknown;
  try {
    user = await fetchCurrentUser(tokens.access_token);
  } catch {
    return NextResponse.json({ error: { message: "Unable to load authenticated user." } }, { status: 401 });
  }

  const response = NextResponse.json({ user });
  await setAuthCookies(response, tokens);
  return response;
}
