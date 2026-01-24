/* app/api/products/route.ts */

import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import {
  getAllProducts,
  createProduct,
  type ProductRecord,
} from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   GET — PUBLIC PRODUCTS (NO AUTH)
========================================================= */
export async function GET() {
  try {
    const products = await getAllProducts();
    const now = new Date();

    const enriched = products.map((p) => {
      const start = p.sale_start ? new Date(p.sale_start) : null;
      const end = p.sale_end ? new Date(p.sale_end) : null;

      const isSale =
        !!p.sale_price &&
        !!start &&
        !!end &&
        now >= start &&
        now <= end;

      return {
        ...p,
        isSale,
        finalPrice: isSale ? p.sale_price : p.price,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("❌ GET PRODUCTS ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_FETCH_PRODUCTS" },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — CREATE PRODUCT (SELLER ONLY)
   AUTH: Authorization: Bearer <Pi accessToken>
========================================================= */
export async function POST(req: Request) {
  // 🔐 AUTH + RBAC
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    // 🔎 Validate payload tối thiểu
    if (!body?.name || typeof body.price !== "number") {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    // 🔥 seller_id = users.pi_uid (TEXT)
    const product = await createProduct(auth.user.pi_uid, {
      name: body.name.trim(),
      price: body.price,
      description: body.description ?? "",
      images: Array.isArray(body.images) ? body.images : [],
      category_id: body.categoryId ?? null,
      sale_price: body.salePrice ?? null,
      sale_start: body.saleStart ?? null,
      sale_end: body.saleEnd ?? null,
      views: 0,
      sold: 0,
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("❌ CREATE PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_CREATE_PRODUCT" },
      { status: 500 }
    );
  }
}
