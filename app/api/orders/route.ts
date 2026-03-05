import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PI_API_KEY = process.env.PI_API_KEY!;

type PiPayment = {
  identifier: string;
  amount: number;
  status: {
    developer_completed: boolean;
  };
  transaction?: {
    txid?: string;
  };
};

type ExistingOrder = {
  id: string;
  order_number: string;
};

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");

  const rand = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

  return `PI-${y}${m}${d}-${rand}`;
}

/* =====================================================
   CREATE ORDER FROM PI PAYMENT
===================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      paymentId: string;
      buyerId: string;
      shippingName: string;
      shippingPhone: string;
      shippingAddress: string;
    };

    const {
      paymentId,
      buyerId,
      shippingName,
      shippingPhone,
      shippingAddress,
    } = body;

    if (!paymentId || !buyerId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    /* ===============================
       1. VERIFY PAYMENT FROM PI
    =============================== */

    const verifyRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "PI_VERIFY_FAILED" },
        { status: 400 }
      );
    }

    const payment = (await verifyRes.json()) as PiPayment;

    if (!payment.status.developer_completed) {
      return NextResponse.json(
        { error: "PAYMENT_NOT_COMPLETED" },
        { status: 400 }
      );
    }

    if (!payment.transaction?.txid) {
      return NextResponse.json(
        { error: "MISSING_TXID" },
        { status: 400 }
      );
    }

    /* ===============================
       2. CHECK EXISTING ORDER
    =============================== */

    const checkUrl =
      `${SUPABASE_URL}/rest/v1/orders` +
      `?pi_payment_id=eq.${encodeURIComponent(payment.identifier)}`;

    const existingRes = await fetch(checkUrl, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    });

    if (existingRes.ok) {
      const existing =
        (await existingRes.json()) as ExistingOrder[];

      if (existing.length > 0) {
        return NextResponse.json(existing[0], { status: 200 });
      }
    }

    /* ===============================
       3. BUILD ORDER DATA
    =============================== */

    const orderNumber = generateOrderNumber();

    const subtotal = Math.round(payment.amount);
    const shippingFee = 0;
    const discount = 0;
    const tax = 0;
    const total = subtotal;

    const orderPayload = {
      order_number: orderNumber,

      buyer_id: buyerId,

      pi_payment_id: payment.identifier,
      pi_txid: payment.transaction.txid,

      payment_status: "paid",

      subtotal,
      shipping_fee: shippingFee,
      discount,
      tax,
      total,

      currency: "PI",

      status: "pending",

      shipping_name: shippingName,
      shipping_phone: shippingPhone,
      shipping_address: shippingAddress,
    };

    /* ===============================
       4. INSERT ORDER
    =============================== */

    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(orderPayload),
      }
    );

    if (!insertRes.ok) {
      const errText = await insertRes.text();

      console.error("ORDER INSERT ERROR:", errText);

      return NextResponse.json(
        { error: "ORDER_INSERT_FAILED" },
        { status: 500 }
      );
    }

    const inserted = await insertRes.json();

    return NextResponse.json(inserted[0], { status: 200 });
  } catch (err) {
    console.error("ORDER API ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
