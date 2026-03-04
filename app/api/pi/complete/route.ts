import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface CompleteBody {
  paymentId: string;
  txid: string;
}

export async function POST(req: Request) {
  try {
    /* =========================
       AUTH CHECK
    ========================= */
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    /* =========================
       BODY VALIDATION
    ========================= */
    const body: CompleteBody = await req.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_DATA" },
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

    /* =========================
       COMPLETE PAYMENT
    ========================= */
    const completeRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
      }
    );

    const completeData = await completeRes.json();

    if (!completeRes.ok) {
      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED", details: completeData },
        { status: completeRes.status }
      );
    }

    /* =========================
       FETCH PAYMENT DETAIL
    ========================= */
    const paymentRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${apiKey}`,
        },
      }
    );

    const payment = await paymentRes.json();

    if (!paymentRes.ok) {
      return NextResponse.json(
        { error: "PI_FETCH_FAILED" },
        { status: 500 }
      );
    }

    /* =========================
       VERIFY PAYMENT
    ========================= */
    if (payment.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "PAYMENT_NOT_COMPLETED" },
        { status: 400 }
      );
    }

    if (!payment.metadata) {
      return NextResponse.json(
        { error: "MISSING_METADATA" },
        { status: 400 }
      );
    }

    const metadata = payment.metadata;

    /* =========================
       IDEMPOTENCY CHECK
    ========================= */
    const existing = await query(
      `SELECT id FROM orders WHERE payment_id = $1 LIMIT 1`,
      [paymentId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ success: true });
    }

    /* =========================
       INSERT ORDER
    ========================= */
    await query(
      `
      INSERT INTO orders (
        payment_id,
        txid,
        user_uid,
        product_id,
        quantity,
        price,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_province,
        shipping_country,
        shipping_postal_code,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending'
      )
      `,
      [
        paymentId,
        txid,
        payment.user_uid,
        metadata.item.product_id,
        metadata.item.quantity,
        metadata.item.price,
        metadata.shipping.name,
        metadata.shipping.phone,
        metadata.shipping.address_line,
        metadata.shipping.province,
        metadata.shipping.country ?? null,
        metadata.shipping.postal_code ?? null,
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("PI COMPLETE SERVER ERROR:", error);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
