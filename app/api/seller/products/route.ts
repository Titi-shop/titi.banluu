import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { resolveRole } from "@/lib/auth/resolveRole";
import { getSellerProducts } from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   HELPERS – xác định user từ Pi
========================= */
async function getUserFromToken() {
  const auth = headers().get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

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
    uid: data.uid,
    username: data.username ?? "",
  };
}

/* =========================
   GET /api/seller/products
========================= */
export async function GET() {
  /**
   * 1️⃣ Xác thực user (Bearer-first – Pi Browser)
   */
  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /**
   * 2️⃣ RBAC – kiểm tra role seller từ DATABASE
   */
  const role = await resolveRole(user);
  if (role !== "seller") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  /**
   * 3️⃣ Lấy sản phẩm TỪ DATABASE
   */
  const products = await getSellerProducts(user.uid);

  return NextResponse.json(products);
}
