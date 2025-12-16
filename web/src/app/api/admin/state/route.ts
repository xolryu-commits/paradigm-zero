import { NextResponse } from "next/server";

let memoryStore: any = null;

export async function GET() {
  return NextResponse.json({ ok: true, data: memoryStore });
}

export async function POST(req: Request) {
  const adminKey = req.headers.get("x-admin-key");

  if (adminKey !== "1217") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json();
  memoryStore = payload;

  return NextResponse.json({ ok: true });
}