import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const params = await request.json();

    if (!params.industryCategory || !params.ideaDescription) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 });
    }

    // Generate session ID
    const sessionId = `sf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const pythonUrl = process.env.PYTHON_BACKEND_URL ?? "http://localhost:8000";

    const res = await fetch(`${pythonUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, params }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Backend error: ${err}` }, { status: 502 });
    }

    return NextResponse.json({
      sessionId,
      message: "Analisis dimulai",
      streamUrl: `/api/stream/${sessionId}`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
