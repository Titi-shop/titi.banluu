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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    let products;

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
        `${process.env.SUPABASE_URL}/rest/v1/products?id=in.(${inFilter})&select=id,name,images,price,sale_price,sale_start,sale_end`,
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
   ENRICH (FIX TIMEZONE SAFE)
=============================== */
const now = Date.now(); // ✅ UTC timestamp

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
      detailImages,
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
      price, // Pi decimal nhỏ OK
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
      detail,
      images,
      detailImages,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = body as Record<string, unknown>;

    if (
      typeof id !== "string" &&
      typeof id !== "number"
    ) {
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

    const updated = await updateProductBySeller(
      auth.user.pi_uid,
      String(id),
      {
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
