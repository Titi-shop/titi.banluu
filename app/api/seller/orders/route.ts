/* app/api/seller/orders/route.ts */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrdersBySeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   PI AUTH (NETWORK–FIRST)
========================= */
async function getUserFromPi() {
  const auth = headers().get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.slice(7).trim();
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
    pi_uid: data.uid as string,
    username: data.username ?? "",
    wallet_address: data.wallet_address ?? null,
  };
}

/* =========================
   GET /api/seller/orders
========================= */
export async function GET(req: Request) {
  try {
    /* 1️⃣ AUTH */
    const user = await getUserFromPi();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    /* 2️⃣ RBAC */
    const role = await resolveRole(user);
    if (role !== "seller") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    /* 3️⃣ QUERY PARAMS */
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    /* 4️⃣ DB */
    const orders = await getOrdersBySeller(
      user.pi_uid,
      status
    );

    return NextResponse.json(orders);
  } catch (err) {
    console.error("SELLER ORDERS ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_LOAD_ORDERS" },
      { status: 500 }
    );
  }
}
