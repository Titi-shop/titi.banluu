import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const dynamic = "force-dynamic";

const PI_API = process.env.PI_API_URL!;
const PI_KEY = process.env.PI_API_KEY!;

/* =========================
UTILS
========================= */

function safeQuantity(v: unknown) {
  const n = Number(v);
  if (!Number.isInteger(n)) return 1;
  if (n < 1) return 1;
  if (n > 10) return 10;;
  return n;
}

/* =========================
API
========================= */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const paymentId = body.paymentId;
    const txid = body.txid;
    const productId = body.product_id;
    const quantity = safeQuantity(body.quantity);

    if (!paymentId || !txid || !productId) {
      return NextResponse.json(
        { error: "INVALID_BODY" },
        { status: 400 }
      );
    }

    /* =========================
    AUTH (NETWORK FIRST)
    ========================= */

    const authUser = await getUserFromBearer(req);

    if (!authUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const pi_uid = authUser.pi_uid;

    /* =========================
    IDEMPOTENT (ANTI DUPLICATE)
    ========================= */

    const { rows: existing } = await query(
      `select id from orders where pi_payment_id=$1`,
      [paymentId]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        order_id: existing[0].id,
      });
    }

    /* =========================
    LOAD PRODUCT
    ========================= */

    const { rows: productRows } = await query(
      `
      select id,name,seller_id,images,price,sale_price,
       sale_start,sale_end,
       is_active,
       status,
       deleted_at
      from products
      where id=$1
      `,
      [productId]
    );

    const product = productRows[0];

    if (!product || product.is_active === false) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_AVAILABLE" },
        { status: 400 }
      );
    }

    /* =========================
    CALCULATE PRICE (SERVER ONLY)
    ========================= */

    const now = Date.now();

    const start = product.sale_start
      ? new Date(product.sale_start).getTime()
      : null;

    const end = product.sale_end
      ? new Date(product.sale_end).getTime()
      : null;

    const isSale =
      product.sale_price !== null &&
      start !== null &&
      end !== null &&
      now >= start &&
      now <= end;

    const unitPrice = Number(
      isSale ? product.sale_price : product.price
    );

    const expectedTotal = Number(
      (unitPrice * quantity).toFixed(6)
    );

    /* =========================
    VERIFY PAYMENT WITH PI
    ========================= */

    const piRes = await fetch(
      `${PI_API}/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${PI_KEY}`,
        },
        cache: "no-store",
      }
    );

    const payment = await piRes.json();

    if (!piRes.ok) {
      return NextResponse.json(
        { error: "PI_PAYMENT_NOT_FOUND" },
        { status: 400 }
      );
    }

    /* =========================
    VERIFY OWNER
    ========================= */

    if (payment.user_uid !== pi_uid) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_OWNER" },
        { status: 403 }
      );
    }

    /* =========================
    VERIFY AMOUNT
    ========================= */

    const piAmount = Number(payment.amount);

    if (Math.abs(piAmount - expectedTotal) > 0.00001) {
      return NextResponse.json(
        { error: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    /* =========================
    COMPLETE PAYMENT
    ========================= */

    const completeRes = await fetch(
      `${PI_API}/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
        cache: "no-store",
      }
    );

    const completed = await completeRes.json();

    if (!completeRes.ok || !completed.status?.developer_completed) {
      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED" },
        { status: 400 }
      );
    }

    /* =========================
    LOAD SHIPPING (SERVER SIDE)
    ========================= */

    const { rows: addrRows } = await query(
      `
      select full_name, phone, address_line, country, postal_code
      from addresses
      where user_id=$1 and is_default=true
      limit 1
      `,
      [pi_uid]
    );

    const addr = addrRows[0];

    if (!addr) {
      return NextResponse.json(
        { error: "NO_SHIPPING_ADDRESS" },
        { status: 400 }
      );
    }

    /* =========================
    CREATE ORDER
    ========================= */

    const { rows: orderRows } = await query(
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
      on conflict (pi_payment_id) do nothing
      returning id
      `,
      [
        pi_uid,
        paymentId,
        txid,
        expectedTotal,
        expectedTotal,
        addr.full_name,
        addr.phone,
        addr.address_line,
        addr.country ?? "",
        addr.postal_code ?? "",
      ]
    );

    const orderId = orderRows[0]?.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "ORDER_EXISTS" },
        { status: 409 }
      );
    }

    /* =========================
    CREATE ORDER ITEM
    ========================= */

    await query(
      `
      insert into order_items (
        order_id,
        product_id,
        seller_id,
        product_name,
        thumbnail,
        images,
        unit_price,
        quantity,
        total_price
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        orderId,
        product.id,
        product.seller_id,
        product.name,
        product.images?.[0] ?? "",
        product.images ?? [],
        unitPrice,
        quantity,
        expectedTotal,
      ]
    );

    /* =========================
    UPDATE SOLD
    ========================= */

    await query(
      `
      update products
      set sold = sold + $1
      where id = $2
      `,
      [quantity, product.id]
    );

    /* =========================
    SUCCESS
    ========================= */

    return NextResponse.json({
      success: true,
      order_id: orderId,
    });

  } catch (err) {
    console.error("COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
