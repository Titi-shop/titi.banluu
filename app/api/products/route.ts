import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import {
  createProduct,
  updateProductBySeller,
} from "@/lib/db/products";
import {
  getVariantsByProductId,
  createVariantsForProduct,
  replaceVariantsByProductId,
} from "@/lib/db/variants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */
type ProductVariantInput = {
  sku: string;
  price: number;
  stock: number;
  option1: string;
  option2?: string | null;
  option3?: string | null;
};

function normalizeVariants(input: unknown): ProductVariantInput[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;

      const row = item as Record<string, unknown>;

      const option1 =
        typeof row.option1 === "string" ? row.option1.trim() : "";

      const sku = typeof row.sku === "string" ? row.sku.trim() : "";

      const price =
        typeof row.price === "number" && !Number.isNaN(row.price)
          ? row.price
          : 0;

      const stock =
        typeof row.stock === "number" && !Number.isNaN(row.stock) && row.stock >= 0
          ? row.stock
          : 0;

      const option2 =
        typeof row.option2 === "string" && row.option2.trim() !== ""
          ? row.option2.trim()
          : null;

      const option3 =
        typeof row.option3 === "string" && row.option3.trim() !== ""
          ? row.option3.trim()
          : null;

      if (!option1) return null;
      if (price <= 0) return null;
      if (!sku) return null;

      return {
        sku,
        price,
        stock,
        option1,
        option2,
        option3,
      };
    })
    .filter((v): v is ProductVariantInput => v !== null);
}

/* =========================================================
   GET — PUBLIC PRODUCTS (NO AUTH)
========================================================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    let products: any[] = [];

    /* ===============================
       CASE 1 — /api/products?ids=...
    =============================== */
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
        `${process.env.SUPABASE_URL}/rest/v1/products?id=in.(${inFilter})&select=*`,
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

      products = await res.json();
    }

    /* ===============================
       CASE 2 — /api/products (ALL)
    =============================== */
    else {
      const res = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/products?select=*`,
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
        console.error("❌ FETCH ALL PRODUCTS ERROR:", err);
        return NextResponse.json([]);
      }

      products = await res.json();
    }

    /* ===============================
       ENRICH + LOAD VARIANTS
    =============================== */
    const now = Date.now();

    const enriched = await Promise.all(
      products.map(async (p: any) => {
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

        const stock = typeof p.stock === "number" ? p.stock : 0;
        const isActive = p.is_active !== false;

        let variants: ProductVariantInput[] = [];
        try {
          variants = await getVariantsByProductId(p.id);
        } catch (err) {
          console.error(`❌ GET VARIANTS ERROR FOR PRODUCT ${p.id}:`, err);
        }

        return {
          id: p.id,
          name: p.name,

          description: typeof p.description === "string" ? p.description : "",
          detail: typeof p.detail === "string" ? p.detail : "",

          images: Array.isArray(p.images) ? p.images : [],
          thumbnail: p.thumbnail ?? p.images?.[0] ?? "",

          categoryId: p.category_id ?? null,
          price: typeof p.price === "number" ? p.price : 0,
          salePrice: typeof p.sale_price === "number" ? p.sale_price : null,

          isSale,
          finalPrice: isSale ? p.sale_price : p.price,

          stock,
          isActive,
          isOutOfStock: stock <= 0 || !isActive,

          views: typeof p.views === "number" ? p.views : 0,
          sold: typeof p.sold === "number" ? p.sold : 0,

          variants,
        };
      })
    );

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
    } = body as Record<string, unknown>;

    if (typeof name !== "string" || typeof price !== "number") {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const normalizedVariants = normalizeVariants(variants);

    const product = await createProduct(auth.user.pi_uid, {
      name: name.trim(),
      price,

      description: typeof description === "string" ? description : "",
      detail: typeof detail === "string" ? detail : "",

      images: Array.isArray(images)
        ? images.filter((i): i is string => typeof i === "string")
        : [],

      thumbnail: typeof thumbnail === "string" ? thumbnail : null,

      category_id:
        typeof categoryId === "string" && categoryId.trim() !== ""
          ? categoryId
          : null,

      sale_price: typeof salePrice === "number" ? salePrice : null,
      sale_start: typeof saleStart === "string" ? saleStart : null,
      sale_end: typeof saleEnd === "string" ? saleEnd : null,

      stock: typeof stock === "number" && stock >= 0 ? stock : 0,
      is_active: typeof is_active === "boolean" ? is_active : true,

      views: 0,
      sold: 0,
    });

    let createdVariants: ProductVariantInput[] = [];
    if (normalizedVariants.length > 0) {
      createdVariants = await createVariantsForProduct(
        product.id,
        normalizedVariants,
        price
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        variants: createdVariants,
      },
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
    } = body as Record<string, unknown>;

    if (typeof id !== "string" && typeof id !== "number") {
      return NextResponse.json(
        { error: "INVALID_PRODUCT_ID" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || typeof price !== "number") {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const productId = String(id);
    const normalizedVariants = normalizeVariants(variants);

    const updated = await updateProductBySeller(
      auth.user.pi_uid,
      productId,
      {
        name: name.trim(),
        price,

        description: typeof description === "string" ? description : "",
        detail: typeof detail === "string" ? detail : "",

        images: Array.isArray(images)
          ? images.filter((i): i is string => typeof i === "string")
          : [],

        thumbnail: typeof thumbnail === "string" ? thumbnail : null,

        category_id:
          typeof categoryId === "string" && categoryId.trim() !== ""
            ? categoryId
            : null,

        sale_price: typeof salePrice === "number" ? salePrice : null,
        sale_start: typeof saleStart === "string" ? saleStart : null,
        sale_end: typeof saleEnd === "string" ? saleEnd : null,

        stock: typeof stock === "number" && stock >= 0 ? stock : 0,
        is_active: typeof is_active === "boolean" ? is_active : true,
      }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND_OR_FORBIDDEN" },
        { status: 404 }
      );
    }

    await replaceVariantsByProductId(productId, normalizedVariants, price);

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
   DELETE — DELETE PRODUCT (SELLER ONLY)
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

    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/products?id=eq.${id}&seller_id=eq.${auth.user.pi_uid}`,
      {
        method: "DELETE",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          Prefer: "return=representation",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ DELETE ERROR:", text);
      return NextResponse.json(
        { error: "FAILED_TO_DELETE_PRODUCT" },
        { status: 500 }
      );
    }

    const deleted = await res.json();

    if (!deleted.length) {
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
