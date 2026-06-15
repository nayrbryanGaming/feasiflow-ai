import { NextResponse } from "next/server";

export async function POST() {
  const sessionId = `sf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return NextResponse.json({ sessionId });
}
