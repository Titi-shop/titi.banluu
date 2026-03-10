import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const PI_API = process.env.PI_API_URL!;
const PI_KEY = process.env.PI_API_KEY!;

/* =========================
   UTILS
========================= */

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeQuantity(v: unknown) {
  const n = Number(v);
  if (!Number.isInteger(n)) return 1;
  if (n < 1) return 1;
  if (n > 99) return 99;
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

    if (!paymentId || !txid || !productId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    /* =========================
       LOAD PRODUCT
    ========================= */

    const { rows } = await query(
      `
      select id,name,seller_id,images,price,sale_price
      from products
      where id=$1
      `,
      [productId]
    );

    const product = rows[0];

    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND" },
        { status: 404 }
      );
    }

    /* =========================
       VALIDATE INPUT
    ========================= */

    const shipping = body.shipping ?? {};
    const user = body.user ?? {};

    const quantity = safeQuantity(body.quantity);
    const clientTotal = safeNumber(body.total);

    if (!user.pi_uid) {
      return NextResponse.json(
        { error: "INVALID_USER" },
        { status: 400 }
      );
    }

    /* =========================
       CALCULATE PRICE
    ========================= */

    const unitPrice =
      product.sale_price ?? product.price;

    const expectedTotal =
      Number((unitPrice * quantity).toFixed(6));

    /* =========================
       CLIENT PRICE CHECK
    ========================= */

    if (Math.abs(clientTotal - expectedTotal) > 0.00001) {

      console.error("CLIENT PRICE MISMATCH", {
        clientTotal,
        expectedTotal
      });

      return NextResponse.json(
        { error: "INVALID_PRICE" },
        { status: 400 }
      );
    }

    /* =========================
       COMPLETE PI PAYMENT
    ========================= */

    const piRes = await fetch(
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

    const payment = await piRes.json();

    if (!piRes.ok) {

      console.error("PI COMPLETE FAIL:", payment);

      return NextResponse.json(
        { error: "PI_PAYMENT_FAILED" },
        { status: 400 }
      );
    }

    /* =========================
       VERIFY PI PAYMENT
    ========================= */

    const piAmount = safeNumber(payment.amount);

    if (Math.abs(piAmount - expectedTotal) > 0.00001) {

      console.error("PI AMOUNT MISMATCH", {
        piAmount,
        expectedTotal
      });

      return NextResponse.json(
        { error: "INVALID_PI_AMOUNT" },
        { status: 400 }
      );
    }

    if (payment.status !== "completed") {
      return NextResponse.json(
        { error: "PAYMENT_NOT_COMPLETED" },
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
        user.pi_uid,
        paymentId,
        txid,
        expectedTotal,
        expectedTotal,
        shipping.name ?? "",
        shipping.phone ?? "",
        shipping.address_line ?? "",
        shipping.country ?? "",
        shipping.postal_code ?? "",
      ]
    );

    const orderId = orderRows[0]?.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "ORDER_ALREADY_EXISTS" },
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
        expectedTotal
      ]
    );

    /* =========================
       SUCCESS
    ========================= */

    return NextResponse.json({
      success: true,
      order_id: orderId
    });

  } catch (err) {

    console.error("PI COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
