import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_KEY = process.env.PI_API_KEY;
    const res = await fetch("https://api.minepi.com/v2/payments/test", {
      headers: { Authorization: `Key ${API_KEY}` },
    });
    const data = await res.text();
    return new NextResponse(`✅ API OK: ${data}`, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
