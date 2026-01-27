import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getSellerProducts } from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES (API BOUNDARY)
========================= */
type SellerProduct = {
  id: string;
  name: string;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
};

/* =========================
   GET /api/seller/products
========================= */
export async function GET() {
  try {
    /* 1️⃣ AUTH */
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    /* 2️⃣ RBAC */
    const role = await resolveRole(user);

    // BOOTSTRAP-SAFE: chưa là seller => chưa có sản phẩm
    if (role !== "seller" && role !== "admin") {
      return NextResponse.json([], { status: 200 });
    }

    /* 3️⃣ FETCH */
    const products =
      (await getSellerProducts(
        user.pi_uid
      )) as SellerProduct[];

    return NextResponse.json(products);
  } catch (err) {
    console.warn("SELLER PRODUCTS WARN:", err);
    // ❗ Không crash UI seller
    return NextResponse.json([], { status: 200 });
  }
}
