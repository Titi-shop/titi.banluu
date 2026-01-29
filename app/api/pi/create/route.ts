import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🟢 PI CREATE BODY:", body);

    const { amount, memo, metadata } = body;

    if (typeof amount !== "number") {
      return NextResponse.json(
        { error: "invalid amount" },
        { status: 400 }
      );
    }

    const API_URL =
      process.env.PI_API_URL ||
      process.env.NEXT_PUBLIC_PI_API_URL;

    const API_KEY = process.env.PI_API_KEY;

    if (!API_URL || !API_KEY) {
      console.error("❌ PI ENV MISSING", {
        API_URL,
        API_KEY: !!API_KEY,
      });

      return NextResponse.json(
        { error: "pi_env_missing" },
        { status: 500 }
      );
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        memo,
        metadata,
      }),
    });

    const raw = await res.text();

    /* =========================
       PI ERROR / HTML GUARD
    ========================= */
    if (!res.ok) {
      console.error("❌ PI CREATE FAILED:", raw);
      return NextResponse.json(
        { error: "pi_create_failed", raw },
        { status: res.status }
      );
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("❌ PI RETURNED NON-JSON:", raw);
      return NextResponse.json(
        { error: "pi_invalid_response" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("💥 PI CREATE EXCEPTION:", err);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}
