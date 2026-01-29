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
   RUNTIME GUARDS
========================= */

function isOrderItem(value: unknown): value is OrderItemInput {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;

  return (
    typeof v.productId === "string" &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  );
}

function isCreateOrderBody(value: unknown): value is CreateOrderBody {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;

  if (!Array.isArray(v.items)) return false;
  if (!v.items.every(isOrderItem)) return false;

  if ("note" in v && typeof v.note !== "string") return false;

  return true;
}

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
/* =========================
   POST /api/orders
   → tạo đơn sau khi Pi payment COMPLETE
   ⚠️ KHÔNG REQUIRE AUTH
========================= */
export async function POST(req: Request) {
  const body = await req.json();

  /**
   * Payload từ checkout:
   * {
   *   id,
   *   buyer,
   *   items,
   *   total,
   *   txid,
   *   shipping,
   *   status,
   *   createdAt
   * }
   */

  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray(body.items) ||
    typeof body.buyer !== "string" ||
    typeof body.txid !== "string"
  ) {
    return NextResponse.json(
      { error: "INVALID_ORDER_PAYLOAD" },
      { status: 400 }
    );
  }

  // ❗ buyer ở đây là username / pi_uid gửi từ checkout
  const order = await createOrder({
    buyerPiUid: body.buyer,
    items: body.items,
    note: body.note ?? null,
    txid: body.txid,
    status: "paid",
    createdAt: body.createdAt ?? new Date().toISOString(),
  });

  return NextResponse.json(order, { status: 201 });
}
