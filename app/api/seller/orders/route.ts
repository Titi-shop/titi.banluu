/* app/api/seller/orders/route.ts */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrdersBySeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   PI AUTH (BEARER FIRST)
========================= */
async function getUserFromPi() {
  const auth = headers().get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.uid) return null;

  return {
    pi_uid: String(data.uid),
    username: data.username ?? "",
    wallet_address: data.wallet_address ?? null,
  };
}

/* =========================
   GET — SELLER ORDERS
========================= */
export async function GET(req: Request) {
  const user = await getUserFromPi();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);
  if (role !== "seller") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const orders = await getOrdersBySeller(user.pi_uid, status);

  return NextResponse.json(orders);
}
