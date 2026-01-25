/* =========================================================
   /api/seller/products
   - Pi Network = Identity Provider
   - Auth: Bearer <Pi accessToken>
   - RBAC: DB source of truth (public.users.role)
   - seller_id = users.pi_uid
========================================================= */

import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { resolveRole } from "@/lib/auth/resolveRole";
import { getSellerProducts } from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   🔐 VERIFY PI TOKEN → SESSION USER
========================================================= */
type AuthUser = {
  pi_uid: string;
  username: string;
  wallet_address?: string | null;
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
    pi_uid: String(data.uid),          // 🔥 QUAN TRỌNG
    username: String(data.username),
    wallet_address: data.wallet_address ?? null,
  };
}

/* =========================================================
   GET /api/seller/products
========================================================= */
export async function GET() {
  /* -------------------------
     1️⃣ AUTH – BEARER FIRST
  ------------------------- */
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* -------------------------
     2️⃣ RBAC – DB ROLE
  ------------------------- */
  const role = await resolveRole(user);

  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  /* -------------------------
     3️⃣ FETCH SELLER PRODUCTS
     seller_id = users.pi_uid
  ------------------------- */
  const products = await getSellerProducts(user.pi_uid);

  return NextResponse.json(products);
}
