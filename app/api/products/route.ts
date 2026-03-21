import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import {
  getAllProducts,
  createProduct,
  updateProductBySeller,
  deleteProductBySeller,
  type ProductVariant,
} from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductPayload = Record<string, unknown>;

function normalizeVariants(input: unknown, fallbackPrice = 0): ProductVariant[] {
  if (!Array.isArray(input)) return [];

  return input.map((v) => {
    const item = v as Record<string, unknown>;

    return {
      option1: typeof item.option1 === "string" ? item.option1.trim() : "",
      option2:
        typeof item.option2 === "string" && item.option2.trim() !== ""
          ? item.option2.trim()
          : null,
      option3:
        typeof item.option3 === "string" && item.option3.trim() !== ""
          ? item.option3.trim()
          : null,
      price:
        typeof item.price === "number" && !Number.isNaN(item.price)
          ? item.price
          : fallbackPrice,
      stock:
        typeof item.stock === "number" && !Number.isNaN(item.stock) && item.stock >= 0
          ? item.stock
          : 0,
      sku: typeof item.sku === "string" ? item.sku.trim() : "",
    };
  });
}

function toPublicProduct(p: any) {
  const start =
    typeof p.sale_start === "string" ? new Date(p.sale_start).getTime() : null;

  const end =
    typeof p.sale_end === "string" ? new Date(p.sale_end).getTime() : null;

  const now = Date.now();

  const isSale =
    typeof p.sale_price === "number" &&
    start !== null &&
    end !== null &&
    now >= start &&
    now <= end;

  const stock = typeof p.stock === "number" ? p.stock : 0;
  const isActive = p.is_active !== false;
  const variants = Array.isArray(p.variants) ? p.variants : [];

  return {
    id: p.id,
    name: typeof p.name === "string" ? p.name : "",
    description: typeof p.description === "string" ? p.description : "",
    detail: typeof p.detail === "string" ? p.detail : "",
    images: Array.isArray(p.images) ? p.images : [],
    thumbnail: typeof p.thumbnail === "string" ? p.thumbnail : p.images?.[0] ?? "",
    categoryId: p.category_id ?? null,
    price: typeof p.price === "number" ? p.price : 0,
    salePrice: typeof p.sale_price === "number" ? p.sale_price : null,
    saleStart: typeof p.sale_start === "string" ? p.sale_start : null,
    saleEnd: typeof p.sale_end === "string" ? p.sale_end : null,
    stock,
    isActive,
    isOutOfStock: stock <= 0,
    isSale,
    finalPrice: isSale ? p.sale_price : p.price,
    views: typeof p.views === "number" ? p.views : 0,
    sold: typeof p.sold === "number" ? p.sold : 0,
    variants,
  };
}

/* =========================================================
   GET — PUBLIC PRODUCTS (NO AUTH)
========================================================= */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    if (ids) {
      const idArray = ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (idArray.length === 0) {
        return NextResponse.json([]);
      }

      const inFilter = idArray.map((id) => `"${id}"`).join(",");

      const res = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/products?id=in.(${inFilter})&deleted_at=is.null&select=*`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.error("❌ FETCH PRODUCTS BY IDS ERROR:", err);
        return NextResponse.json([]);
      }

      const products = await res.json();
      return NextResponse.json(products.map(toPublicProduct));
    }

    const products = await getAllProducts();
    return NextResponse.json(products.map(toPublicProduct));
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
      detail,
      images,
      thumbnail,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
      stock,
      is_active,
      variants,
    } = body as ProductPayload;

    if (typeof name !== "string" || typeof price !== "number" || Number.isNaN(price)) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const cleanedVariants = normalizeVariants(variants, price);

    const product = await createProduct(auth.user.pi_uid, {
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      detail: typeof detail === "string" ? detail : "",
      images: Array.isArray(images)
        ? images.filter((i): i is string => typeof i === "string")
        : [],
      thumbnail: typeof thumbnail === "string" ? thumbnail : null,
      detail_images: [],
      variants: cleanedVariants,
      price,
      sale_price: typeof salePrice === "number" ? salePrice : null,
      sale_start: typeof saleStart === "string" ? saleStart : null,
      sale_end: typeof saleEnd === "string" ? saleEnd : null,
      stock: typeof stock === "number" && stock >= 0 ? stock : 0,
      category_id:
        typeof categoryId === "string" && categoryId.trim() !== ""
          ? categoryId
          : null,
      is_active: typeof is_active === "boolean" ? is_active : true,
    });

    return NextResponse.json({ success: true, product: toPublicProduct(product) });
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
      detail,
      images,
      thumbnail,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
      stock,
      is_active,
      variants,
    } = body as ProductPayload;

    if (typeof id !== "string" && typeof id !== "number") {
      return NextResponse.json(
        { error: "INVALID_PRODUCT_ID" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || typeof price !== "number" || Number.isNaN(price)) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const cleanedVariants = normalizeVariants(variants, price);

    const updated = await updateProductBySeller(auth.user.pi_uid, String(id), {
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      detail: typeof detail === "string" ? detail : "",
      images: Array.isArray(images)
        ? images.filter((i): i is string => typeof i === "string")
        : [],
      thumbnail: typeof thumbnail === "string" ? thumbnail : null,
      variants: cleanedVariants,
      price,
      sale_price: typeof salePrice === "number" ? salePrice : null,
      sale_start: typeof saleStart === "string" ? saleStart : null,
      sale_end: typeof saleEnd === "string" ? saleEnd : null,
      stock: typeof stock === "number" && stock >= 0 ? stock : 0,
      category_id:
        typeof categoryId === "string" && categoryId.trim() !== ""
          ? categoryId
          : null,
      is_active: typeof is_active === "boolean" ? is_active : true,
    });

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
   DELETE — SOFT DELETE PRODUCT (SELLER ONLY)
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

    const deleted = await deleteProductBySeller(auth.user.pi_uid, id);

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
