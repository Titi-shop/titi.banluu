import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getPiApiUrl() {
  return process.env.NEXT_PUBLIC_PI_ENV === "testnet"
    ? "https://api.minepi.com/v2/sandbox/payments"
    : "https://api.minepi.com/v2/payments";
}

export async function POST(req: Request) {
  try {
    const { amount, memo, metadata, uid } = await req.json();

    if (!uid || typeof amount !== "number") {
      return NextResponse.json(
        { error: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const res = await fetch(getPiApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.PI_API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        memo,
        metadata,
        uid, // 🔴 BẮT BUỘC
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("❌ PI CREATE FAILED:", text);
      return NextResponse.json(
        { error: "PI_CREATE_FAILED", raw: text },
        { status: res.status }
      );
    }

    // 🔴 PHẢI TRẢ NGUYÊN OBJECT PI
    return new NextResponse(text, { status: 200 });

  } catch (err) {
    console.error("💥 PI CREATE ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
