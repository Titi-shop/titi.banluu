import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId, txid } = await req.json();
    console.log("📡 [Pi COMPLETE] Giao dịch:", paymentId, txid);

    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.njwgouspt6vqo1pqc5hb0wv9vgxxptmityjm2xnujmg0hqkuqwoa3m4fgxz4t81l
      ;
    const API_URL = "https://api.minepi.com/v2/payments";

    // ✅ Gọi đến Pi API thật
    const res = await fetch(`${API_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const data = await res.text();
    console.log("✅ [Pi COMPLETE SUCCESS]:", data);

    return new NextResponse(data, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    console.error("❌ [Pi COMPLETE ERROR]:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
