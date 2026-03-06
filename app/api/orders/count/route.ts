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
    select count(*)::int as total
    from orders
    where buyer_uid = $1
    `,
    [user.pi_uid]
  );

  return NextResponse.json({
    total: rows[0].total,
  });
}
