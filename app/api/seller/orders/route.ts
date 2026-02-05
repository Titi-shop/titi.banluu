/* =========================================================
   app/api/seller/orders/route.ts
   - NETWORK–FIRST Pi Auth
   - AUTH-CENTRIC + RBAC
   - BOOTSTRAP MODE (Phase 1)
   - Bearer ONLY (NO cookie)
========================================================= */

import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrdersBySeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */

type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "cancelled"
  | "completed";

/* =========================
   HELPERS
========================= */

function parseOrderStatus(
  value: string | null
): OrderStatus | undefined {
  if (!value) return undefined;

  const allowed: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "cancelled",
  "completed",
];

  return allowed.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : undefined;
}

/* =========================================================
   GET /api/seller/orders
   BOOTSTRAP RULE:
   - Not seller yet => return []
========================================================= */

export async function GET(req: Request) {
  /* 1️⃣ AUTH */
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* 2️⃣ RBAC */
  const role = await resolveRole(user);

  // BOOTSTRAP: chưa là seller => chưa có đơn
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json([], { status: 200 });
  }

  /* 3️⃣ QUERY PARAMS */
  const { searchParams } = new URL(req.url);
  const status = parseOrderStatus(
    searchParams.get("status")
  );

  /* 4️⃣ DB */
  try {
    const orders = await getOrdersBySeller(
      user.pi_uid,
      status
    );
    return NextResponse.json(orders);
  } catch (err) {
    console.warn("SELLER ORDERS WARN:", err);
    return NextResponse.json([], { status: 200 });
  }
}
