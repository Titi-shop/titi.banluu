import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { createOrder, getOrdersByBuyer } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   GET /api/orders
========================= */
export async function GET() {
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const orders = await getOrdersByBuyer(user.pi_uid);
  return NextResponse.json(orders);
}

/* =========================
   POST /api/orders
========================= */
export async function POST(req: Request) {
  try {
    /* =========================
       1️⃣ AUTH
    ========================= */
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    /* =========================
       2️⃣ PARSE BODY
    ========================= */
    const body = await req.json();

    const {
      items,
      total,
      shipping,
      pi_payment_id,
    } = body as {
      items: {
        product_id: string;
        quantity: number;
        price: number;
      }[];
      total: number;
      shipping: {
        name: string;
        phone: string;
        address: string;
        provider: string;
        country: string;
        postal_code?: string | null;
      };
      pi_payment_id: string;
    };

    /* =========================
       3️⃣ VALIDATE BODY
    ========================= */

    if (!Array.isArray(items) || typeof total !== "number") {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "EMPTY_ORDER" }, { status: 400 });
    }

    if (total <= 0) {
      return NextResponse.json({ error: "INVALID_TOTAL" }, { status: 400 });
    }

    for (const i of items) {
      if (
        !i.product_id ||
        typeof i.quantity !== "number" ||
        i.quantity <= 0 ||
        typeof i.price !== "number" ||
        i.price <= 0
      ) {
        return NextResponse.json(
          { error: "INVALID_ORDER_ITEM" },
          { status: 400 }
        );
      }
    }

    if (
      !shipping ||
      typeof shipping.name !== "string" ||
      !shipping.name.trim() ||
      typeof shipping.phone !== "string" ||
      !shipping.phone.trim() ||
      typeof shipping.address !== "string" ||
      !shipping.address.trim() ||
      typeof shipping.provider !== "string" ||
      !shipping.provider.trim() ||
      typeof shipping.country !== "string" ||
      !shipping.country.trim()
    ) {
      return NextResponse.json(
        { error: "INVALID_SHIPPING_INFO" },
        { status: 400 }
      );
    }

    if (
      typeof pi_payment_id !== "string" ||
      !pi_payment_id.trim()
    ) {
      return NextResponse.json(
        { error: "INVALID_PI_PAYMENT_ID" },
        { status: 400 }
      );
    }

    /* =========================
       4️⃣ VERIFY PAYMENT WITH PI
    ========================= */

    const verifyRes = await fetch(
      `https://api.minepi.com/v2/payments/${pi_payment_id}`,
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
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
      user_uid: string;
      amount: number;
      status: {
        developer_completed: boolean;
        transaction_verified: boolean;
      };
      transaction?: {
        txid: string;
      };
    };

    /* =========================
       5️⃣ SECURITY CHECKS
    ========================= */

    if (payment.user_uid !== user.pi_uid) {
      return NextResponse.json(
        { error: "PAYMENT_USER_MISMATCH" },
        { status: 403 }
      );
    }

    if (
      !payment.status.developer_completed ||
      !payment.status.transaction_verified
    ) {
      return NextResponse.json(
        { error: "PAYMENT_NOT_CONFIRMED" },
        { status: 400 }
      );
    }

    if (!payment.transaction?.txid) {
      return NextResponse.json(
        { error: "MISSING_TXID" },
        { status: 400 }
      );
    }

    /* =========================
       6️⃣ NORMALIZE SHIPPING
    ========================= */

    const normalizedShipping = {
      name: shipping.name.trim(),
      phone: shipping.phone.trim(),
      address: shipping.address.trim(),
      provider: shipping.provider.trim(),
      country: shipping.country.trim(),
      postal_code:
        typeof shipping.postal_code === "string" &&
        shipping.postal_code.trim()
          ? shipping.postal_code.trim()
          : null,
    };

    /* =========================
       7️⃣ CREATE ORDER
    ========================= */

    const order = await createOrder({
      buyerPiUid: user.pi_uid,
      piPaymentId: payment.identifier,
      piTxid: payment.transaction.txid,
      items,
      total,
      shipping: normalizedShipping,
    });

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_CREATION_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json(order, { status: 201 });

  } catch (error) {
    console.error("ORDER API ERROR:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
