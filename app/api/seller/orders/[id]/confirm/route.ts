import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConfirmBody = {
  seller_message?: string;
};

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

    let body: ConfirmBody = {};

    try {
      body = (await req.json()) as ConfirmBody;
    } catch {
      body = {};
    }

    const sellerMessage: string | null =
      typeof body.seller_message === "string"
        ? body.seller_message.trim()
        : null;

    /* ================= UPDATE ORDER ITEMS ================= */

    const itemResult = await query(
      `
      update order_items
      set
        status = 'confirmed',
        seller_message = $3
      where
        order_id = $1
      and seller_id = $2
      and status = 'pending'
      `,
      [params.id, user.pi_uid, sellerMessage]
    );

    if (!itemResult.rowCount) {
      return NextResponse.json(
        { error: "ORDER_ITEM_NOT_UPDATED" },
        { status: 400 }
      );
    }

    /* ================= UPDATE ORDERS ================= */

    const orderResult = await query(
      `
      update orders
      set status = 'pickup'
      where id = $1
      and status = 'pending'
      `,
      [params.id]
    );

    if (!orderResult.rowCount) {
      console.warn("⚠️ ORDER STATUS NOT CHANGED", params.id);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ CONFIRM ORDER ERROR:", err);

    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
