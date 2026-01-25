/* =========================================================
   app/api/seller/orders/route.ts
   - NETWORK–FIRST Pi Auth
   - AUTH-CENTRIC + RBAC
   - BOOTSTRAP MODE (Phase 1)
   - Bearer ONLY (NO cookie)
   - Stable on Pi Browser (iOS + Android)
========================================================= */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrdersBySeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   PI AUTH — BEARER ONLY (NETWORK-FIRST)
========================================================= */
async function getUserFromPi() {
  const authHeader = headers().get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();

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

/* =========================================================
   GET /api/seller/orders
   BOOTSTRAP RULE:
   - Seller chưa tồn tại => 200 []
========================================================= */
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

    // BOOTSTRAP: chưa là seller => chưa có đơn
    if (role !== "seller") {
      return NextResponse.json([], { status: 200 });
    }

    /* 3️⃣ QUERY PARAMS */
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    /* 4️⃣ DB */
    const orders = await getOrdersBySeller(user.pi_uid, status);

    return NextResponse.json(orders);
  } catch (err) {
    // BOOTSTRAP: không để lỗi nghiệp vụ làm crash
    console.warn("SELLER ORDERS BOOTSTRAP WARN:", err);
    return NextResponse.json([], { status: 200 });
  }
}
