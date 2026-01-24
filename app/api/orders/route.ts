import { NextResponse } from "next/server";
import { headers } from "next/headers";

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
   HELPER – xác thực Pi user
========================= */
async function getUserFromPi(): Promise<{ uid: string }> {
  const auth = headers().get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("UNAUTHENTICATED");
  }

  const token = auth.slice("Bearer ".length).trim();
  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("UNAUTHENTICATED");

  const data: unknown = await res.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("uid" in data) ||
    typeof (data as { uid: unknown }).uid !== "string"
  ) {
    throw new Error("UNAUTHENTICATED");
  }

  return { uid: (data as { uid: string }).uid };
}

/* =========================
   GET /api/orders
   → customer xem đơn của mình
========================= */
export async function GET() {
  try {
    const user = await getUserFromPi();

    const role = await resolveRole(user);
    if (role !== "customer") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const orders = await getOrdersByBuyer(user.uid);
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }
}

/* =========================
   POST /api/orders
   → tạo đơn hàng mới
========================= */
export async function POST(req: Request) {
  try {
    const user = await getUserFromPi();

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
      buyerPiUid: user.uid,
      items,
      note:
        typeof (body as CreateOrderBody).note === "string"
          ? (body as CreateOrderBody).note
          : null,
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }
}
