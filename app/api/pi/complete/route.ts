import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const dynamic = "force-dynamic";

const PI_API = process.env.PI_API_URL!;
const PI_KEY = process.env.PI_API_KEY!;

function safeQuantity(v: unknown) {
  const n = Number(v);
  if (!Number.isInteger(n)) return 1;
  if (n < 1) return 1;
  if (n > 10) return 10;
  return n;
}

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const body: unknown = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }

    const paymentId =
      "paymentId" in body && typeof body.paymentId === "string"
        ? body.paymentId
        : "";

    const txid =
      "txid" in body && typeof body.txid === "string"
        ? body.txid
        : "";

    const productId =
      "product_id" in body && typeof body.product_id === "string"
        ? body.product_id
        : "";

    const quantity = safeQuantity("quantity" in body ? body.quantity : 1);

    if (!paymentId || !txid || !productId) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }

    const authUser = await getUserFromBearer(req);

    if (!authUser) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const pi_uid = authUser.pi_uid;

    const existingOrder = await client.query(
      `select id from orders where pi_payment_id = $1 limit 1`,
      [paymentId]
    );

    if (existingOrder.rows.length > 0) {
      return NextResponse.json({
        success: true,
        order_id: existingOrder.rows[0].id,
      });
    }

    const productRes = await client.query(
      `
      select
        id,
        name,
        seller_id,
        thumbnail,
        price,
        sale_price,
        sale_start,
        sale_end,
        is_active,
        status,
        deleted_at,
        stock,
        is_unlimited
      from products
      where id = $1
      limit 1
      `,
      [productId]
    );

    const product = productRes.rows[0] as
      | {
          id: string;
          name: string;
          seller_id: string;
          thumbnail: string | null;
          price: number | string;
          sale_price: number | string | null;
          sale_start: string | null;
          sale_end: string | null;
          is_active: boolean | null;
          status: string | null;
          deleted_at: string | null;
          stock: number;
          is_unlimited: boolean;
        }
      | undefined;

    if (
      !product ||
      product.is_active === false ||
      product.status !== "active" ||
      product.deleted_at !== null
    ) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_AVAILABLE" },
        { status: 400 }
      );
    }

    if (!product.is_unlimited && Number(product.stock) < quantity) {
      return NextResponse.json({ error: "OUT_OF_STOCK" }, { status: 400 });
    }

    const now = Date.now();
    const start = product.sale_start ? new Date(product.sale_start).getTime() : null;
    const end = product.sale_end ? new Date(product.sale_end).getTime() : null;

    const isSale =
      product.sale_price !== null &&
      start !== null &&
      end !== null &&
      now >= start &&
      now <= end;

    const basePrice = Number(product.price);
    const salePrice =
      product.sale_price !== null ? Number(product.sale_price) : null;

    const unitPrice = isSale && salePrice !== null ? salePrice : basePrice;

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return NextResponse.json({ error: "INVALID_PRODUCT_PRICE" }, { status: 400 });
    }

    const expectedTotal = Number((unitPrice * quantity).toFixed(6));

    const piRes = await fetch(`${PI_API}/payments/${paymentId}`, {
      headers: {
        Authorization: `Key ${PI_KEY}`,
      },
      cache: "no-store",
    });

    const payment: unknown = await piRes.json();

    if (!piRes.ok) {
      return NextResponse.json(
        { error: "PI_PAYMENT_NOT_FOUND" },
        { status: 400 }
      );
    }

    if (!payment || typeof payment !== "object") {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    const paymentUserUid =
      "user_uid" in payment && typeof payment.user_uid === "string"
        ? payment.user_uid
        : "";

    const paymentStatus =
      "status" in payment && typeof payment.status === "string"
        ? payment.status
        : "";

    const paymentAmount =
      "amount" in payment ? Number(payment.amount) : NaN;

    if (!paymentUserUid || !Number.isFinite(paymentAmount)) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    if (paymentUserUid !== pi_uid) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_OWNER" },
        { status: 403 }
      );
    }

    if (paymentStatus !== "approved") {
      return NextResponse.json(
        { error: "PAYMENT_NOT_APPROVED" },
        { status: 400 }
      );
    }

    if (Math.abs(paymentAmount - expectedTotal) > 0.00001) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const completeRes = await fetch(`${PI_API}/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Key ${PI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txid }),
      cache: "no-store",
    });

    const completed: unknown = await completeRes.json();

    if (!completeRes.ok || !completed || typeof completed !== "object") {
      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED" },
        { status: 400 }
      );
    }

    const developerCompleted =
      "status" in completed &&
      completed.status &&
      typeof completed.status === "object" &&
      "developer_completed" in completed.status &&
      completed.status.developer_completed === true;

    if (!developerCompleted) {
      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED" },
        { status: 400 }
      );
    }

    const addressRes = await client.query(
      `
      select full_name, phone, address_line, country, postal_code
      from addresses
      where user_id = $1 and is_default = true
      limit 1
      `,
      [pi_uid]
    );

    const addr = addressRes.rows[0] as
      | {
          full_name: string;
          phone: string;
          address_line: string;
          country: string | null;
          postal_code: string | null;
        }
      | undefined;

    if (!addr) {
      return NextResponse.json(
        { error: "NO_SHIPPING_ADDRESS" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const stockUpdate = await client.query(
      `
      update products
      set
        sold = sold + $1,
        stock = case
          when is_unlimited = true then stock
          else stock - $1
        end
      where id = $2
        and is_active = true
        and status = 'active'
        and deleted_at is null
        and (is_unlimited = true or stock >= $1)
      returning id
      `,
      [quantity, product.id]
    );

    if (stockUpdate.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "OUT_OF_STOCK" }, { status: 400 });
    }

    const orderInsert = await client.query(
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
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

    const orderId = orderInsert.rows[0]?.id as string | undefined;

    if (!orderId) {
      await client.query("ROLLBACK");

      const existed = await client.query(
        `select id from orders where pi_payment_id = $1 limit 1`,
        [paymentId]
      );

      if (existed.rows.length > 0) {
        return NextResponse.json({
          success: true,
          order_id: existed.rows[0].id,
        });
      }

      return NextResponse.json({ error: "ORDER_EXISTS" }, { status: 409 });
    }

    await client.query(
      `
      insert into order_items (
        order_id,
        product_id,
        seller_id,
        product_name,
        thumbnail,
        unit_price,
        quantity,
        total_price
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        orderId,
        product.id,
        product.seller_id,
        product.name,
        product.thumbnail ?? "",
        unitPrice,
        quantity,
        expectedTotal,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      order_id: orderId,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    console.error("COMPLETE ERROR:", err);

    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  } finally {
    client.release();
  }
}
