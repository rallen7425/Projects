import { NextRequest, NextResponse } from "next/server";
import { getPrefs, setPrefs } from "@/lib/prefsStore";

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });
  return NextResponse.json(getPrefs(clientId));
}

export async function POST(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });
  try {
    const body = await request.json();
    setPrefs(clientId, { saved: body.saved ?? [], tracked: body.tracked ?? [] });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
