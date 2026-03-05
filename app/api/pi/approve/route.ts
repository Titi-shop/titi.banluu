import { NextRequest, NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";

export const dynamic = "force-dynamic";

type ApproveBody = {
  paymentId: string;
};

export async function POST(req: NextRequest) {
  try {

    /* =========================
       1️⃣ VERIFY TOKEN
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
       2️⃣ BODY
    ========================= */

    const body: ApproveBody = await req.json();

    if (!body.paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    /* =========================
       3️⃣ APPROVE PI PAYMENT
    ========================= */

    const res = await fetch(
      `https://api.minepi.com/v2/payments/${body.paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
    });

  } catch (err) {

    console.error("PI APPROVE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );

  }
}
