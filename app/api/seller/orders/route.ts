/* app/api/seller/orders/route.ts */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   PI AUTH
========================= */
async function getUserFromPi() {
  const auth = headers().get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("UNAUTHENTICATED");
  }

  const token = auth.slice("Bearer ".length).trim();

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("UNAUTHENTICATED");

  const data = await res.json();
  if (!data?.uid) throw new Error("UNAUTHENTICATED");

  return { uid: data.uid as string };
}

/* =========================
   GET — SELLER ORDERS
========================= */
export async function GET(req: Request) {
  try {
    const user = await getUserFromPi();
    const role = await resolveRole(user);

    if (role !== "seller") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    const orders = await getOrdersBySeller(
      user.uid,
      status
    );

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }
}
