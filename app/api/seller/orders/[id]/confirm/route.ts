import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderItemStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "returned";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);

  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    /* =========================
       BODY
    ========================= */

    const body = await req.json();

    const sellerMessage: string | null =
      typeof body?.seller_message === "string"
        ? body.seller_message.trim()
        : null;

    /* =========================
       UPDATE ORDER ITEMS
       seller confirm only their items
    ========================= */

    const { rowCount } = await query(
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

    if (!rowCount) {
      return NextResponse.json(
        { error: "UPDATE_FAILED" },
        { status: 400 }
      );
    }

    /* =========================
       UPDATE ORDER STATUS
       only if all items confirmed
    ========================= */

    await query(
      `
      update orders
      set status = 'confirmed'
      where id = $1
      and not exists (
        select 1
        from order_items
        where order_id = $1
        and status = 'pending'
      )
      `,
      [params.id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ CONFIRM ORDER ERROR:", err);

    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
