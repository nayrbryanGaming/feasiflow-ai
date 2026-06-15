import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const pythonUrl = process.env.PYTHON_BACKEND_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(`${pythonUrl}/result/${sessionId}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Result fetch failed" }, { status: 500 });
  }
}
