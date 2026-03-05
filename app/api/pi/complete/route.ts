import { NextRequest, NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    /* =========================
       VERIFY USER
    ========================= */
    const auth = req.headers.get("authorization");

    if (!auth) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "").trim();

    const user = await verifyPiToken(token);

    if (!user?.pi_uid) {
      return NextResponse.json(
        { error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    /* =========================
       BODY
    ========================= */
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    /* =========================
       APPROVE PAYMENT
    ========================= */
    const res = await fetch(
      `${process.env.PI_API_URL}/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("PI APPROVE ERROR:", data);

      return NextResponse.json(
        { error: "PI_APPROVE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: data,
    });

  } catch (err) {
    console.error("💥 PI APPROVE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
