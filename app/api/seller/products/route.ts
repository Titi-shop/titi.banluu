/* =========================================================
   app/api/seller/products/route.ts
   - Pi Network = Identity Provider
   - Auth: Bearer <Pi accessToken>
   - RBAC: DB source of truth
========================================================= */

import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getSellerProducts } from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   GET /api/seller/products
========================================================= */
export async function GET() {
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
     3️⃣ FETCH PRODUCTS
  ------------------------- */
  const products = await getSellerProducts(user.pi_uid);

  return NextResponse.json(products);
}
