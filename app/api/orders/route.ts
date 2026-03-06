import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPiUserFromToken } from "@/lib/piAuth";

export const dynamic = "force-dynamic";

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

    const user = await getPiUserFromToken(token);

    if (!user?.pi_uid) {
      return NextResponse.json(
        { error: "INVALID_USER" },
        { status: 401 }
      );
    }

    const { rows } = await query(
`
select
  o.*,
  coalesce(
    json_agg(
      json_build_object(
        'product_id', oi.product_id,
        'quantity', oi.quantity,
        'price', oi.unit_price
      )
    ) filter (where oi.id is not null),
    '[]'
  ) as order_items
from orders o
left join order_items oi
on oi.order_id = o.id
where o.buyer_id = $1
group by o.id
order by o.created_at desc
`,
      [user.pi_uid]
    );

    return NextResponse.json(rows);

  } catch (err) {

    console.error("GET ORDERS ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
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
