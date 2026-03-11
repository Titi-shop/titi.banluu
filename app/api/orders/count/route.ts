import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPiToken } from "@/lib/piAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {

  try {

    /* ================= AUTH ================= */

    const auth = req.headers.get("authorization");

    if (!auth) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    const user = await verifyPiToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    /* ================= DATABASE ================= */

    const { rows } = await query(
      `
      select
        count(*) filter (where status = 'pending')::int   as pending,
        count(*) filter (where status = 'pickup')::int    as pickup,
        count(*) filter (where status = 'shipping')::int  as shipping,
        count(*) filter (where status = 'completed')::int as completed,
        count(*) filter (where status = 'cancelled')::int as cancelled
      from orders
      where buyer_id = $1
      `,
      [user.pi_uid]
    );

    return NextResponse.json(rows[0]);

  } catch (err) {

    console.error("ORDER COUNT ERROR:", err);

    return NextResponse.json(
      {
        pending: 0,
        pickup: 0,
        shipping: 0,
        completed: 0,
        cancelled: 0
      },
      { status: 200 }
    );
  }
}
