import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { getOrdersByBuyerSafe, createOrderSafe } from "@/lib/db/orders";

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

  const orders = await getOrdersByBuyerSafe(user.pi_uid);
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

  const { items, total } = await req.json();

  if (!Array.isArray(items) || typeof total !== "number") {
    return NextResponse.json(
      { error: "INVALID_BODY" },
      { status: 400 }
    );
  }

  for (const i of items) {
    if (!i.product_id) {
      return NextResponse.json(
        { error: "INVALID_ORDER_ITEM", item: i },
        { status: 400 }
      );
    }
  }

  const order = await createOrderSafe({
    buyerPiUid: user.pi_uid,
    items,
    total,
  });

  return NextResponse.json(order, { status: 201 });
}
