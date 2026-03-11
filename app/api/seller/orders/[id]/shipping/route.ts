/* =========================================================
   SELLER START SHIPPING
   PATCH /api/seller/orders/[id]/shipping
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

    /* ================= UPDATE ITEM ================= */

    const { rowCount } = await query(
      `
      update order_items
      set
        status = 'shipping',
        shipped_at = now()
      where order_id = $1
      and seller_id = $2
      and status = 'confirmed'
      `,
      [params.id, user.pi_uid]
    );

    if (!rowCount) {
      return NextResponse.json(
        { error: "NOTHING_UPDATED" },
        { status: 400 }
      );
    }

    /* ================= CHECK ORDER STATUS ================= */

    const { rows } = await query(
      `
      select count(*) filter (where status != 'shipping') as remaining
      from order_items
      where order_id = $1
      `,
      [params.id]
    );

    const remaining = Number(rows[0]?.remaining ?? 0);

    /* ================= UPDATE ORDER ================= */

    if (remaining === 0) {
      await query(
        `
        update orders
        set status = 'shipping'
        where id = $1
        `,
        [params.id]
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ SHIPPING ERROR:", err);

    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
