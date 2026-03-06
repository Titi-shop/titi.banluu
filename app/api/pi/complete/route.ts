import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PI_API = process.env.PI_API_URL!;
const PI_KEY = process.env.PI_API_KEY!;

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const paymentId = body.paymentId;
    const txid = body.txid;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    const piRes = await fetch(
      `${PI_API}/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
        cache: "no-store",
      }
    );

    const text = await piRes.text();

    if (!piRes.ok) {
      console.error("PI COMPLETE FAIL:", text);
    }

    return new NextResponse(text || "{}", {
      status: piRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (err) {

    console.error("PI COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
