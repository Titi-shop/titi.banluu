import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { verifyPiAccessToken } from "@/lib/piAuth";
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
========================= */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");

  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "MISSING_TOKEN" },
      { status: 403 }
    );
  }

  const token = auth.replace("Bearer ", "");
  const piUser = await verifyPiAccessToken(token);

  if (!piUser) {
    return NextResponse.json(
      { error: "INVALID_TOKEN" },
      { status: 403 }
    );
  }

  const buyerId = piUser.uid; // ✅ PI UID

  const orders = await getOrdersByBuyerSafe(buyerId);
  return NextResponse.json(orders);
}

/* =========================
   POST /api/orders
   - chỉ gọi SAU KHI PI PAYMENT COMPLETE
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { items, total } = body;

  if (!Array.isArray(items) || typeof total !== "number") {
    return NextResponse.json(
      { error: "INVALID_BODY" },
      { status: 400 }
    );
  }

  // ✅ VALIDATE ITEM
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
