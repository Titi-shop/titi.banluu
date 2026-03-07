import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";

import {
  getAllProducts,
  getProductsByIds,
  createProduct,
  updateProductBySeller,
  deleteProductBySeller,
} from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   GET — PUBLIC PRODUCTS
========================================================= */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    let products;

    if (ids) {
      const idArray = ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (!idArray.length) return NextResponse.json([]);

      products = await getProductsByIds(idArray);
    } else {
      products = await getAllProducts();
    }

    const now = Date.now();

    const enriched = products.map((p: any) => {
      const start =
        typeof p.sale_start === "string"
          ? new Date(p.sale_start).getTime()
          : null;

      const end =
        typeof p.sale_end === "string"
          ? new Date(p.sale_end).getTime()
          : null;

      const isSale =
        typeof p.sale_price === "number" &&
        start !== null &&
        end !== null &&
        now >= start &&
        now <= end;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        detail: p.detail ?? "",

        images: p.images ?? [],
        detailImages: p.detail_images ?? [],

        categoryId: p.category_id,

        price: p.price,
        salePrice: p.sale_price,

        isSale,
        finalPrice: isSale ? p.sale_price : p.price,

        views: p.views ?? 0,
        sold: p.sold ?? 0,
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
   POST — CREATE PRODUCT (SELLER)
========================================================= */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    const {
      name,
      price,
      description,
      detail,
      images,
      detailImages,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = body;

    if (typeof name !== "string" || typeof price !== "number") {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(name);
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    const product = await createProduct(auth.user.pi_uid, {
      slug: uniqueSlug,
      name: name.trim(),
      price,

      description: typeof description === "string" ? description : "",
      detail: typeof detail === "string" ? detail : "",

      images: Array.isArray(images)
        ? images.filter((i) => typeof i === "string")
        : [],

      detail_images: Array.isArray(detailImages)
        ? detailImages.filter((i) => typeof i === "string")
        : [],

      category_id: typeof categoryId === "number" ? categoryId : null,

      sale_price: typeof salePrice === "number" ? salePrice : null,
      sale_start: typeof saleStart === "string" ? saleStart : null,
      sale_end: typeof saleEnd === "string" ? saleEnd : null,

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

/* =========================================================
   PUT — UPDATE PRODUCT
========================================================= */

export async function PUT(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    const {
      id,
      name,
      price,
      description,
      detail,
      images,
      detailImages,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "INVALID_PRODUCT_ID" },
        { status: 400 }
      );
    }

    const updated = await updateProductBySeller(
      auth.user.pi_uid,
      String(id),
      {
        name,
        price,
        description: description ?? "",
        detail: detail ?? "",

        images: Array.isArray(images)
          ? images.filter((i: any) => typeof i === "string")
          : [],

        detail_images: Array.isArray(detailImages)
          ? detailImages.filter((i: any) => typeof i === "string")
          : [],

        category_id:
          typeof categoryId === "number" ? categoryId : null,

        sale_price:
          typeof salePrice === "number" ? salePrice : null,

        sale_start:
          typeof saleStart === "string" ? saleStart : null,

        sale_end:
          typeof saleEnd === "string" ? saleEnd : null,
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

/* =========================================================
   DELETE — DELETE PRODUCT
========================================================= */

export async function DELETE(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "MISSING_PRODUCT_ID" },
        { status: 400 }
      );
    }

    const deleted = await deleteProductBySeller(
      auth.user.pi_uid,
      id
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND_OR_FORBIDDEN" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err);

    return NextResponse.json(
      { error: "FAILED_TO_DELETE_PRODUCT" },
      { status: 500 }
    );
  }
}
