import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPiToken } from "@/lib/piAuth";

/* =========================================================
   GET USER ORDERS
========================================================= */

export async function GET(req: Request) {
  try {

    const auth = req.headers.get("authorization");

    if (!auth) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");

    const user = await verifyPiToken(token);

    const { rows } = await query(
      `
      select
        id,
        order_number,
        total,
        currency,
        status,
        payment_status,
        created_at
      from orders
      where buyer_id = $1
      order by created_at desc
      `,
      [user.pi_uid]
    );

    return NextResponse.json(rows);

  } catch (err) {

    console.error("orders GET error", err);

    return NextResponse.json(
      { error: "ORDERS_FETCH_FAILED" },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE ORDER
========================================================= */

export async function POST(req: Request) {
  try {

    const auth = req.headers.get("authorization");

    if (!auth) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");

    const user = await verifyPiToken(token);

    const body = await req.json();

    const {
      order_number,
      pi_payment_id,
      pi_txid,
      subtotal,
      shipping_fee,
      discount,
      tax,
      total,
      shipping_name,
      shipping_phone,
      shipping_address
    } = body;

    const { rows } = await query(
      `
      insert into orders (
        order_number,
        buyer_id,
        pi_payment_id,
        pi_txid,
        subtotal,
        shipping_fee,
        discount,
        tax,
        total,
        shipping_name,
        shipping_phone,
        shipping_address
      )
      values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
      returning *
      `,
      [
        order_number,
        user.pi_uid,
        pi_payment_id,
        pi_txid,
        subtotal,
        shipping_fee,
        discount,
        tax,
        total,
        shipping_name,
        shipping_phone,
        shipping_address
      ]
    );

    return NextResponse.json(rows[0]);

  } catch (err) {

    console.error("orders POST error", err);

    return NextResponse.json(
      { error: "ORDER_CREATE_FAILED" },
      { status: 500 }
    );
  }
}
