import { NextRequest, NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";

type PiCompleteBody = {
  paymentId: string;
  txid: string;
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    /* =========================
       1️⃣ VERIFY AUTH TOKEN
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
       2️⃣ READ BODY
    ========================= */

    const body: PiCompleteBody = await req.json();

    if (!body.paymentId || !body.txid) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT" },
        { status: 400 }
      );
    }

    /* =========================
       3️⃣ COMPLETE PAYMENT
       PI NETWORK SERVER
    ========================= */

    const res = await fetch(
      `https://api.minepi.com/v2/payments/${body.paymentId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
        body: JSON.stringify({
          txid: body.txid,
        }),
      }
    );

    const text = await res.text();

    if (!res.ok) {
      console.error("PI COMPLETE ERROR:", text);

      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED" },
        { status: 400 }
      );
    }

    /* =========================
       4️⃣ SUCCESS
    ========================= */

    return new NextResponse(text, {
      status: 200,
    });

  } catch (err) {

    console.error("COMPLETE ROUTE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );

  }
}
