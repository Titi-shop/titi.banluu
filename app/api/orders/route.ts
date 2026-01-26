import { NextResponse } from "next/server";

import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import {
  getOrdersByBuyer,
  createOrder,
} from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
type OrderItemInput = {
  productId: string;
  quantity: number;
};

type CreateOrderBody = {
  items: OrderItemInput[];
  note?: string;
};

/* =========================
   GET /api/orders
   → customer xem đơn của mình
========================= */
export async function GET() {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);
  if (role !== "customer") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const orders = await getOrdersByBuyer(user.pi_uid);
  return NextResponse.json(orders);
}

/* =========================
   POST /api/orders
   → tạo đơn hàng mới (CUSTOMER)
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);
  if (role !== "customer") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const body: unknown = await req.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("items" in body) ||
    !Array.isArray((body as { items: unknown }).items)
  ) {
    return NextResponse.json(
      { error: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const items = (body as CreateOrderBody).items;

  if (
    items.length === 0 ||
    items.some(
      i =>
        typeof i.productId !== "string" ||
        typeof i.quantity !== "number" ||
        i.quantity <= 0
    )
  ) {
    return NextResponse.json(
      { error: "INVALID_ITEMS" },
      { status: 400 }
    );
  }

  const order = await createOrder({
    buyerPiUid: user.pi_uid,
    items,
    note:
      typeof (body as CreateOrderBody).note === "string"
        ? (body as CreateOrderBody).note
        : null,
  });

  return NextResponse.json(order, { status: 201 });
}
