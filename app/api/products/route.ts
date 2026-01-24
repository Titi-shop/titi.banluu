/* app/api/products/route.ts */

import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import {
  getAllProducts,
  createProduct,
  ProductRecord,
} from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   GET — PUBLIC PRODUCTS
========================= */
export async function GET() {
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
}

/* =========================
   POST — CREATE PRODUCT (SELLER)
========================= */
export async function POST(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    const product = await createProduct(auth.user.pi_uid, {
      name: body.name,
      price: body.price,
      description: body.description ?? "",
      images: body.images ?? [],
      category_id: body.categoryId ?? null,
      sale_price: body.salePrice ?? null,
      sale_start: body.saleStart ?? null,
      sale_end: body.saleEnd ?? null,
      views: 0,
      sold: 0,
    });

    return NextResponse.json({ success: true, product });
  } catch (e) {
    console.error("CREATE PRODUCT ERROR", e);
    return NextResponse.json(
      { error: "FAILED_TO_CREATE_PRODUCT" },
      { status: 500 }
    );
  }
}
