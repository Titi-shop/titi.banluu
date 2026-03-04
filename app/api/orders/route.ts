import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PI_API_KEY = process.env.PI_API_KEY!;

/* =====================================================
   CREATE ORDER (PI PRODUCTION SAFE)
===================================================== */
export async function createOrderFromPiPayment(
  paymentId: string,
  userId: string
) {
  if (!paymentId || !paymentId.trim()) {
    return NextResponse.json(
      { error: "INVALID_PAYMENT_ID" },
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

  const payment = await verifyRes.json() as {
    identifier: string;
    amount: number;
    status: {
      developer_completed: boolean;
    };
    transaction?: {
      txid?: string;
    };
  };

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
     2. IDEMPOTENT CHECK
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
    const existing = await existingRes.json() as {
      id: string;
    }[];

    if (existing.length > 0) {
      return NextResponse.json(existing[0], { status: 200 });
    }
  }

  /* ===============================
     3. INSERT ORDER
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
      body: JSON.stringify({
        user_id: userId,
        total: payment.amount,
        status: "paid",
        pi_payment_id: payment.identifier,
        txid: payment.transaction.txid,
      }),
    }
  );

  if (!insertRes.ok) {
    return NextResponse.json(
      { error: "ORDER_INSERT_FAILED" },
      { status: 500 }
    );
  }

  const inserted = await insertRes.json() as {
    id: string;
    total: number;
    status: string;
    pi_payment_id: string;
  }[];

  return NextResponse.json(inserted[0], { status: 200 });
}
