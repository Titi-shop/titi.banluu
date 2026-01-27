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

  if (!isCreateOrderBody(body)) {
    return NextResponse.json(
      { error: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const order = await createOrder({
    buyerPiUid: user.pi_uid,
    items: body.items,
    note: body.note ?? null,
  });

  return NextResponse.json(order, { status: 201 });
}
