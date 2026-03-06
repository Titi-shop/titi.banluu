import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPiToken } from "@/lib/piAuth";

/* =========================================================
   TYPES
========================================================= */

type OrderRow = {
  id: number;
  order_number: string;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  payment_status: string;
  provider: string | null;
  country: string | null;
  postal_code: string | null;
  created_at: string;
};

type CreateOrderBody = {
  order_number: string;

  pi_payment_id: string | null;
  pi_txid: string | null;

  subtotal: number;
  shipping_fee: number;
  discount: number;
  tax: number;
  total: number;

  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;

  provider: string | null;
  country: string;
  postal_code: string;
};

/* =========================================================
   AUTH HELPER
========================================================= */

async function getUser(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth) {
    throw new Error("UNAUTHORIZED");
  }

  const token = auth.replace("Bearer ", "");

  if (!token) {
    throw new Error("TOKEN_MISSING");
  }

  return verifyPiToken(token);
}

/* =========================================================
   GET USER ORDERS
========================================================= */

export async function GET(req: Request) {
  try {

    const auth = req.headers.get("authorization");

    if (!auth) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    const user = await verifyPiToken(token);

    /* GET INTERNAL USER ID */

    const { rows: users } = await query(
      `
      select id
      from users
      where pi_uid = $1
      limit 1
      `,
      [user.pi_uid]
    );

    const dbUser = users[0];

    if (!dbUser) {
      return NextResponse.json([]);
    }

    /* LOAD ORDERS */

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
      [dbUser.id]
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
    const user = await getUser(req);

    const body: CreateOrderBody = await req.json();

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
      shipping_address,
      provider,
      country,
      postal_code,
    } = body;

    if (!order_number || !total) {
      return NextResponse.json(
        { error: "INVALID_ORDER_DATA" },
        { status: 400 }
      );
    }

    const existing = await query(
      `
      select id
      from orders
      where order_number = $1
      limit 1
      `,
      [order_number]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "ORDER_ALREADY_EXISTS" },
        { status: 409 }
      );
    }

    const result = await query(
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
        shipping_address,
        provider,
        country,
        postal_code
      )
      values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
      )
      returning
        id,
        order_number,
        subtotal,
        shipping_fee,
        discount,
        tax,
        total,
        currency,
        status,
        payment_status,
        provider,
        country,
        postal_code,
        created_at
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
        shipping_address,
        provider,
        country,
        postal_code,
      ]
    );

    const order: OrderRow = result.rows[0];

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("orders POST error", err);

    return NextResponse.json(
      { error: "ORDER_CREATE_FAILED" },
      { status: 500 }
    );
  }
}
