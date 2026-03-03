import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import {
  getOrdersByBuyer,
  createOrder
} from "@/lib/db/orders";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { items, total, shipping } = await req.json();

  if (!Array.isArray(items) || typeof total !== "number") {
    return NextResponse.json(
      { error: "INVALID_BODY" },
      { status: 400 }
    );
  }

  for (const i of items) {
    if (
      !i.product_id ||
      typeof i.quantity !== "number" ||
      typeof i.price !== "number"
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
  typeof shipping.phone !== "string" ||
  typeof shipping.address !== "string"
) {
  return NextResponse.json(
    { error: "INVALID_SHIPPING_INFO" },
    { status: 400 }
  );
}
   {
    return NextResponse.json(
      { error: "INVALID_SHIPPING_INFO" },
      { status: 400 }
    );
  }

  const order = await createOrder({
    buyerPiUid: user.pi_uid,
    items,
    total,
    shipping,
  });

  for (const item of items) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/increment_product_sold`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pid: item.product_id,
          qty: item.quantity ?? 1,
        }),
      }
    );
  }

  return NextResponse.json(order, { status: 201 });
}
