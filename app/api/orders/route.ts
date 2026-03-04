import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import {
  getOrdersByBuyer,
  createOrder
} from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   GET /api/orders
========================= */
export async function GET() {
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const orders = await getOrdersByBuyer(user.pi_uid);
  return NextResponse.json(orders);
}

/* =========================
   POST /api/orders
========================= */
export async function POST(req: Request) {
  try {
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, total, shipping } = body;

    /* =========================
       VALIDATE BODY
    ========================= */

    if (!Array.isArray(items) || typeof total !== "number") {
      return NextResponse.json(
        { error: "INVALID_BODY" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "EMPTY_ORDER" },
        { status: 400 }
      );
    }

    if (total <= 0) {
      return NextResponse.json(
        { error: "INVALID_TOTAL" },
        { status: 400 }
      );
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
          { error: "INVALID_ORDER_ITEM", item: i },
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
       CREATE ORDER
    ========================= */

    const order = await createOrder({
      buyerPiUid: user.pi_uid,
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

    // Sẽ tăng trong API confirm payment

    return NextResponse.json(order, { status: 201 });

  } catch (error) {
    console.error("ORDER API ERROR:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
