import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

export async function GET(req: NextRequest) {
  const user = await getUserFromBearer(req);
  if (!user) {
    return NextResponse.json({ error: "NO_AUTH" }, { status: 401 });
  }

  const role = await resolveRole(user);

  return NextResponse.json({
    pi_uid: user.pi_uid,
    username: user.username,
    wallet_address: user.wallet_address,
    role,
  });
}
