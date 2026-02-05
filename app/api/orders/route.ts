import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import {
  getOrdersByBuyerSafe,
  createOrderSafe,
} from "@/lib/db/orders";

/* =========================
   CONFIG
========================= */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   GET /api/orders
   - customer xem đơn của mình
   - BOOTSTRAP SAFE: chưa có user → []
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

  const orders = await getOrdersByBuyerSafe(user.pi_uid);
  return NextResponse.json(orders);
}

/* =========================
   POST /api/orders
   - chỉ gọi SAU KHI PI PAYMENT COMPLETE
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json();
  const { items, total } = body;

  if (!Array.isArray(items) || typeof total !== "number") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  // ✅ THÊM ĐOẠN NÀY NGAY TẠI ĐÂY
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
