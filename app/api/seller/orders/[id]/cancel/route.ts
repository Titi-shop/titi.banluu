/* =========================================================
   SELLER CANCEL ORDER ITEMS
   PATCH /api/seller/orders/[id]/cancel
========================================================= */

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    /* ================= AUTH ================= */

    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    /* ================= RBAC ================= */

    const role = await resolveRole(user);

    if (role !== "seller" && role !== "admin") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    /* ================= BODY ================= */

    const body = await req.json();

    const cancelReason: string | null =
      typeof body?.cancel_reason === "string"
        ? body.cancel_reason.trim()
        : null;

    /* ================= UPDATE ================= */

    const { rowCount } = await query(
      `
      update order_items
      set
        status = 'cancelled',
        seller_cancel_reason = $3
      where order_id = $1
      and seller_id = $2
      and status in ('pending','confirmed')
      `,
      [params.id, user.pi_uid, cancelReason]
    );

    if (!rowCount) {
      return NextResponse.json(
        { error: "NOTHING_UPDATED" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ SELLER CANCEL ERROR:", err);

    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
