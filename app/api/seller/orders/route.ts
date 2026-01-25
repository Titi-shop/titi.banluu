/* =========================================================
   /api/seller/orders
   - Pi Network = Identity Provider
   - Auth: Authorization Bearer <Pi accessToken>
   - RBAC: public.users.role
   - seller_id = users.pi_uid
========================================================= */

import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrdersBySeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   🔐 VERIFY PI TOKEN
========================================================= */
type AuthUser = {
  pi_uid: string;
  username: string;
};

async function getUserFromBearer(): Promise<AuthUser | null> {
  const auth = headers().get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;

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
  if (!data?.uid || !data?.username) return null;

  return {
    pi_uid: String(data.uid),     // 🔥 QUAN TRỌNG
    username: String(data.username),
  };
}

/* =========================================================
   GET /api/seller/orders
========================================================= */
export async function GET(req: Request) {
  /* -------------------------
     1️⃣ AUTH
  ------------------------- */
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* -------------------------
     2️⃣ RBAC
  ------------------------- */
  const role = await resolveRole(user);

  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  /* -------------------------
     3️⃣ QUERY PARAMS
  ------------------------- */
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  /* -------------------------
     4️⃣ FETCH ORDERS
     seller_id = users.pi_uid
  ------------------------- */
  const orders = await getOrdersBySeller(
    user.pi_uid,
    status
  );

  return NextResponse.json(orders);
}
