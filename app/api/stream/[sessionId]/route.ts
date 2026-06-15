import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const pythonUrl = process.env.PYTHON_BACKEND_URL ?? "http://localhost:8000";

  try {
    const pythonRes = await fetch(`${pythonUrl}/stream/${sessionId}`, {
      headers: { Accept: "text/event-stream" },
    });

    if (!pythonRes.ok || !pythonRes.body) {
      return NextResponse.json({ error: "Stream not available" }, { status: 502 });
    }

    return new Response(pythonRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Stream error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
