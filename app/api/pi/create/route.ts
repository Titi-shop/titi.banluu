import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🟢 PI CREATE BODY:", body);

    const { amount, memo, metadata, uid } = body;

    if (typeof amount !== "number" || !uid) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400 }
      );
    }

    const BASE_URL =
      process.env.PI_API_URL ||
      process.env.NEXT_PUBLIC_PI_API_URL;

    const API_KEY = process.env.PI_API_KEY;

    if (!BASE_URL || !API_KEY) {
      return NextResponse.json(
        { error: "pi_env_missing" },
        { status: 500 }
      );
    }

    const API_URL = BASE_URL.replace(/\/$/, "");

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
        uid, // 🔥 QUAN TRỌNG
      }),
    });

    const raw = await res.text();

    if (!res.ok) {
      console.error("❌ PI CREATE FAILED:", raw);
      return NextResponse.json(
        { error: "pi_create_failed", raw },
        { status: res.status }
      );
    }

    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    console.error("💥 PI CREATE EXCEPTION:", err);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}
