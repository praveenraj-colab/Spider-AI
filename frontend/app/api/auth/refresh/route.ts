import { NextResponse } from "next/server";

import { clearAuthCookies, refreshAccessToken } from "@/lib/server/backend";

export async function POST() {
  const refreshResult = await refreshAccessToken();
  if (refreshResult.ok && refreshResult.response) {
    return refreshResult.response;
  }

  const response = NextResponse.json({ error: { message: "Session expired." } }, { status: 401 });
  clearAuthCookies(response);
  return response;
}
