import { NextResponse } from "next/server";

import { backendUrl, clearAuthCookies, getRefreshToken } from "@/lib/server/backend";

export async function POST() {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    await fetch(backendUrl("/auth/logout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store"
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
