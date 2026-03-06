import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PI_API = process.env.PI_API_URL!;
const PI_KEY = process.env.PI_API_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const paymentId = body.paymentId;

    if (!paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    const approveRes = await fetch(
      `${PI_API}/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await approveRes.text();

    return new NextResponse(text, {
      status: approveRes.status,
    });

  } catch (err) {
    console.error("PI APPROVE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
