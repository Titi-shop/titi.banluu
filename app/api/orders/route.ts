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
  price: number;
};

type CreateOrderBody = {
  items: OrderItemInput[];
  total: number;
};

/* =========================
   VALIDATION
========================= */
function isCreateOrderBody(v: unknown): v is CreateOrderBody {
  if (typeof v !== "object" || v === null) return false;

  const b = v as Record<string, unknown>;

  if (!Array.isArray(b.items)) return false;
  if (typeof b.total !== "number") return false;

  return b.items.every(
    (i) =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as any).productId === "string" &&
      typeof (i as any).quantity === "number" &&
      typeof (i as any).price === "number"
  );
}

/* =========================
   GET – buyer orders
========================= */
export async function GET() {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const role = await resolveRole(user);
  if (role !== "customer") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const orders = await getOrdersByBuyer(user.pi_uid);
  return NextResponse.json(orders);
}

/* =========================
   POST – create order
   (CALLED AFTER PI COMPLETE)
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const role = await resolveRole(user);
  if (role !== "customer") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = (await req.json()) as unknown;

  if (!isCreateOrderBody(body)) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const order = await createOrder(
    user.pi_uid,
    body.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      price: i.price,
    })),
    body.total
  );

  return NextResponse.json(order, { status: 201 });
}
