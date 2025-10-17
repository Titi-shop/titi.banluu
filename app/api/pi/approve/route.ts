import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.njwgouspt6vqo1pqc5hb0wv9vgxxptmityjm2xnujmg0hqkuqwoa3m4fgxz4t81l;
    const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    const data = await res.text();
    console.log("✅ [Pi APPROVE SUCCESS]:", data);

    return new NextResponse(data, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    console.error("❌ [Pi APPROVE ERROR]:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
