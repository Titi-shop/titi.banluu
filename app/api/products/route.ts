/* app/api/products/route.ts */

import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import {
  getAllProducts,
  createProduct,
  updateProductBySeller,
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
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images,
        category_id: p.category_id,
        price: p.price,
        sale_price: p.sale_price,
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
========================================================= */
export async function POST(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const {
      name,
      price,
      description,
      images,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = body as Record<string, unknown>;

    if (typeof name !== "string" || typeof price !== "number") {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const product = await createProduct(auth.user.pi_uid, {
      name: name.trim(),
      price,
      description: typeof description === "string" ? description : "",
      images: Array.isArray(images) ? images.filter(i => typeof i === "string") : [],
      category_id: typeof categoryId === "string" ? categoryId : null,
      sale_price: typeof salePrice === "number" ? salePrice : null,
      sale_start: typeof saleStart === "string" ? saleStart : null,
      sale_end: typeof saleEnd === "string" ? saleEnd : null,
      views: 0,
      sold: 0,
    });

    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error("❌ CREATE PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_CREATE_PRODUCT" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT — UPDATE PRODUCT (SELLER ONLY)
========================================================= */
export async function PUT(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const {
      id,
      name,
      price,
      description,
      images,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = body as Record<string, unknown>;

    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      typeof price !== "number"
    ) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const updated = await updateProductBySeller(
      auth.user.pi_uid,
      id,
      {
        name: name.trim(),
        price,
        description: typeof description === "string" ? description : "",
        images: Array.isArray(images) ? images.filter(i => typeof i === "string") : [],
        category_id: typeof categoryId === "string" ? categoryId : null,
        sale_price: typeof salePrice === "number" ? salePrice : null,
        sale_start: typeof saleStart === "string" ? saleStart : null,
        sale_end: typeof saleEnd === "string" ? saleEnd : null,
      }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND_OR_FORBIDDEN" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ UPDATE PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_UPDATE_PRODUCT" },
      { status: 500 }
    );
  }
}
