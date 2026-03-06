import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPiToken } from "@/lib/piAuth";

export async function GET(req: Request) {

  const auth = req.headers.get("authorization");

  if (!auth) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const token = auth.replace("Bearer ", "");

  const user = await verifyPiToken(token);

  const { rows } = await query(
    `
    select
      count(*) filter (where status = 'pending')::int   as pending,
      count(*) filter (where status = 'pickup')::int    as pickup,
      count(*) filter (where status = 'shipping')::int  as shipping,
      count(*) filter (where status = 'completed')::int as completed
    from orders
    where buyer_id = $1
    `,
    [user.pi_uid]
  );

  return NextResponse.json(rows[0]);
}
