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

type CreatePaidOrderBody = {
  buyerPiUid: string; // pi_uid hoặc username
  items: OrderItemInput[];
  txid: string; // Pi transaction id
  note?: string;
  createdAt?: string;
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

function isCreatePaidOrderBody(
  value: unknown
): value is CreatePaidOrderBody {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;

  if (typeof v.buyerPiUid !== "string") return false;
  if (typeof v.txid !== "string") return false;

  if (!Array.isArray(v.items)) return false;
  if (!v.items.every(isOrderItem)) return false;

  if ("note" in v && typeof v.note !== "string") return false;
  if ("createdAt" in v && typeof v.createdAt !== "string") return false;

  return true;
}

/* =========================
   GET /api/orders
   → CUSTOMER xem đơn của mình
   → AUTH-CENTRIC + RBAC
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
   → TẠO ĐƠN SAU KHI PI PAYMENT COMPLETE
   ⚠️ KHÔNG AUTH (Pi Wallet callback)
========================= */

export async function POST(req: Request) {
  const body: unknown = await req.json();

  if (!isCreatePaidOrderBody(body)) {
    return NextResponse.json(
      { error: "INVALID_ORDER_PAYLOAD" },
      { status: 400 }
    );
  }

  const order = await createOrder({
    buyerPiUid: body.buyerPiUid,
    items: body.items,
    note: body.note ?? null,
    txid: body.txid,
    status: "paid",
    createdAt: body.createdAt
      ? new Date(body.createdAt)
      : new Date(),
  });

  return NextResponse.json(order, { status: 201 });
}
