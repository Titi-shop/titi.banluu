import { NextRequest, NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";

export const dynamic = "force-dynamic";

type OrderItem = {
  product_id: number;
  quantity: number;
  price: number;
};

type Shipping = {
  name: string;
  phone: string;
  address_line?: string;
  address?: string;
  province?: string;
  provider?: string;
  country?: string;
  postal_code?: string | null;
};

type PiCompleteBody = {
  paymentId: string;
  txid: string;
  items?: OrderItem[];
  total?: number;
  shipping?: Shipping;
};

export async function POST(req: NextRequest) {
  try {
    /* =========================
       1️⃣ VERIFY AUTH HEADER
    ========================= */

    const auth = req.headers.get("authorization");

    if (!auth || !auth.startsWith("Bearer ")) {
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
        { error: "INVALID_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    /* =========================
       3️⃣ VERIFY PAYMENT WITH PI
    ========================= */

    const verifyRes = await fetch(
      `https://api.minepi.com/v2/payments/${body.paymentId}`,
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "PAYMENT_NOT_FOUND" },
        { status: 400 }
      );
    }

    const payment = await verifyRes.json();

    if (!payment || payment.status?.developer_completed) {
      return NextResponse.json(
        { error: "PAYMENT_ALREADY_COMPLETED" },
        { status: 400 }
      );
    }

    /* =========================
       4️⃣ COMPLETE PAYMENT
    ========================= */

    const completeRes = await fetch(
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

    const completeText = await completeRes.text();

    if (!completeRes.ok) {
      console.error("PI COMPLETE ERROR:", completeText);

      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED" },
        { status: 400 }
      );
    }

    /* =========================
       5️⃣ SUCCESS
    ========================= */

    return new NextResponse(completeText, {
      status: 200,
    });

  } catch (err) {
    console.error("PI COMPLETE ROUTE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
