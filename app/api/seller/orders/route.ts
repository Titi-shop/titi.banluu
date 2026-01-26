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

/* =========================================================
   GET /api/seller/orders
   BOOTSTRAP RULE:
   - Not seller yet => return []
========================================================= */
export async function GET(req: Request) {
  try {
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
    const status = searchParams.get("status") ?? undefined;

    /* 4️⃣ DB */
    const orders = await getOrdersBySeller(
      user.pi_uid,
      status
    );

    return NextResponse.json(orders);
  } catch (err) {
    // BOOTSTRAP: không crash UI
    console.warn("SELLER ORDERS WARN:", err);
    return NextResponse.json([], { status: 200 });
  }
}
