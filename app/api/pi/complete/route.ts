import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { paymentId } = await req.json();
    if (!paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SERVER_CONFIG_ERROR" },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        headers: { Authorization: `Key ${apiKey}` },
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "VERIFY_FAILED" },
        { status: 400 }
      );
    }

    const payment = await verifyRes.json();

    if (payment.user_uid !== user.pi_uid) {
      return NextResponse.json(
        { error: "PAYMENT_OWNER_MISMATCH" },
        { status: 403 }
      );
    }

    if (payment.status === "approved") {
      return NextResponse.json({ success: true });
    }

    if (payment.status !== "created") {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_STATUS" },
        { status: 400 }
      );
    }

    const approveRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Key ${apiKey}` },
      }
    );

    const data = await approveRes.json();

    return NextResponse.json(data, {
      status: approveRes.status,
    });

  } catch (err) {
    console.error("💥 PI APPROVE ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
