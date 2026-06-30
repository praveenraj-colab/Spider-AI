import { NextRequest, NextResponse } from "next/server";

import { backendUrl } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const backendResponse = await fetch(backendUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const data = await backendResponse.json();
  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  return NextResponse.json({ user: data }, { status: 201 });
}
