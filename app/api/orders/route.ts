import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const paymentId = body.paymentId;
    const txid = body.txid;
    const user = body.user;
    const shipping = body.shipping;
    const items = body.items ?? [];

    if (!paymentId || !txid || !user?.pi_uid) {
      return NextResponse.json(
        { error: "INVALID_ORDER_DATA" },
        { status: 400 }
      );
    }

    const subtotal = Math.round(body.subtotal ?? 0);
    const total = Math.round(body.total ?? 0);

    /* =========================
       START TRANSACTION
    ========================= */

    await query("BEGIN");

    const orderRes = await query(
      `
      insert into orders (
        order_number,
        buyer_id,
        pi_payment_id,
        pi_txid,
        subtotal,
        total,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_country,
        shipping_postal_code
      )
      values (
        gen_random_uuid()::text,
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      on conflict (pi_payment_id) do update
      set pi_txid = excluded.pi_txid
      returning id
      `,
      [
        user.pi_uid,
        paymentId,
        txid,
        subtotal,
        total,
        shipping?.name ?? "",
        shipping?.phone ?? "",
        shipping?.address_line ?? "",
        shipping?.country ?? "",
        shipping?.postal_code ?? "",
      ]
    );

    const orderId = orderRes.rows[0]?.id;

    /* =========================
       INSERT ORDER ITEMS
    ========================= */

    for (const item of items) {

      await query(
        `
        insert into order_items (
          order_id,
          product_id,
          product_name,
          price,
          quantity
        )
        values ($1,$2,$3,$4,$5)
        `,
        [
          orderId,
          item.product_id,
          item.name,
          Math.round(item.price),
          item.quantity,
        ]
      );

    }

    await query("COMMIT");

    return NextResponse.json({
      success: true,
      orderId,
    });

  } catch (err) {

    await query("ROLLBACK");

    console.error("ORDER CREATE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
