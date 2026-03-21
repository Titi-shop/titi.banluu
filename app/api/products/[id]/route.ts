import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* =========================
   TYPES
========================= */
type ProductVariantRow = {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  stock: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type ProductVariant = {
  option1: string;
  option2?: string | null;
  option3?: string | null;
  price: number;
  stock: number;
  sku: string;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  detail: string | null;
  images: string[] | null;
  thumbnail: string | null;
  category_id: string | null;
  price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  views: number | null;
  sold: number | null;
  stock: number | null;
  is_active: boolean | null;
  deleted_at?: string | null;
};

function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

function normalizeVariants(input: unknown, fallbackPrice = 0): ProductVariant[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((v) => {
      const item = v as Record<string, unknown>;

      return {
        option1:
          typeof item.option1 === "string" ? item.option1.trim() : "",
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
          typeof item.stock === "number" &&
          !Number.isNaN(item.stock) &&
          item.stock >= 0
            ? item.stock
            : 0,
        sku: typeof item.sku === "string" ? item.sku.trim() : "",
      };
    })
    .filter((v) => v.option1 !== "");
}

async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/variants?product_id=eq.${encodeURIComponent(
      productId
    )}&select=*`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ FETCH VARIANTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_VARIANTS");
  }

  const rows: ProductVariantRow[] = await res.json();

  return rows.map((v) => ({
    option1: v.option1 ?? "",
    option2: v.option2 ?? null,
    option3: v.option3 ?? null,
    price: typeof v.price === "number" ? v.price : 0,
    stock: typeof v.stock === "number" ? v.stock : 0,
    sku: v.sku ?? "",
  }));
}

async function replaceProductVariants(productId: string, variants: ProductVariant[]) {
  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/variants?product_id=eq.${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (!deleteRes.ok) {
    const text = await deleteRes.text();
    console.error("❌ DELETE OLD VARIANTS ERROR:", text);
    throw new Error("FAILED_TO_DELETE_OLD_VARIANTS");
  }

  if (!variants.length) return;

  const insertPayload = variants.map((v) => ({
    product_id: productId,
    sku: v.sku || "",
    price: v.price,
    stock: v.stock,
    option1: v.option1 || null,
    option2: v.option2 || null,
    option3: v.option3 || null,
  }));

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/variants`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(insertPayload),
  });

  if (!insertRes.ok) {
    const text = await insertRes.text();
    console.error("❌ INSERT VARIANTS ERROR:", text);
    throw new Error("FAILED_TO_INSERT_VARIANTS");
  }
}

/* =========================
   PATCH /api/products/[id]
========================= */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "MISSING_PRODUCT_ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const price =
      typeof body.price === "number" && !Number.isNaN(body.price)
        ? body.price
        : 0;

    const cleanedVariants = normalizeVariants(body.variants, price);

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(
        id
      )}&seller_id=eq.${encodeURIComponent(auth.user.pi_uid)}`,
      {
        method: "PATCH",
        headers: {
          ...supabaseHeaders(),
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: typeof body.name === "string" ? body.name.trim() : "",
          description:
            typeof body.description === "string" ? body.description : "",
          detail: typeof body.detail === "string" ? body.detail : "",
          images: Array.isArray(body.images)
            ? body.images.filter((item: unknown) => typeof item === "string")
            : [],
          thumbnail:
            typeof body.thumbnail === "string" ? body.thumbnail : null,
          category_id:
            typeof body.categoryId === "string" && body.categoryId.trim() !== ""
              ? body.categoryId
              : null,
          price,
          sale_price:
            typeof body.salePrice === "number" ? body.salePrice : null,
          sale_start:
            typeof body.saleStart === "string" && body.saleStart.trim() !== ""
              ? body.saleStart
              : null,
          sale_end:
            typeof body.saleEnd === "string" && body.saleEnd.trim() !== ""
              ? body.saleEnd
              : null,
          stock:
            typeof body.stock === "number" && body.stock >= 0 ? body.stock : 0,
          is_active:
            typeof body.is_active === "boolean" ? body.is_active : true,
        }),
      }
    );

    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error("❌ PATCH PRODUCT ERROR:", text);
      return NextResponse.json(
        { error: "FAILED_TO_UPDATE_PRODUCT" },
        { status: 500 }
      );
    }

    const data: ProductRow[] = await updateRes.json();

    if (!data.length) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND_OR_FORBIDDEN" },
        { status: 404 }
      );
    }

    await replaceProductVariants(id, cleanedVariants);

    const p = data[0];
    const variants = await getProductVariants(id);

    return NextResponse.json({
      id: p.id,
      name: p.name,
      price: p.price,
      salePrice: p.sale_price ?? null,
      saleStart: p.sale_start ?? null,
      saleEnd: p.sale_end ?? null,
      description: p.description ?? "",
      detail: p.detail ?? "",
      images: p.images ?? [],
      thumbnail: p.thumbnail ?? (p.images?.[0] ?? ""),
      categoryId: p.category_id ?? "",
      stock: p.stock ?? 0,
      is_active: p.is_active ?? true,
      variants,
    });
  } catch (err) {
    console.error("❌ PRODUCT PATCH ERROR:", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/* =========================
   GET /api/products/[id]
========================= */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "MISSING_PRODUCT_ID" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(
        id
      )}&deleted_at=is.null&select=*`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ FETCH PRODUCT ERROR:", text);
      return NextResponse.json(
        { error: "FAILED_TO_FETCH_PRODUCT" },
        { status: 500 }
      );
    }

    const data: ProductRow[] = await res.json();

    if (data.length === 0) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const p = data[0];
    const variants = await getProductVariants(id);

    return NextResponse.json({
      id: p.id,
      name: p.name,
      price: p.price,
      salePrice: p.sale_price ?? null,
      saleStart: p.sale_start ?? null,
      saleEnd: p.sale_end ?? null,
      description: p.description ?? "",
      detail: p.detail ?? "",
      images: p.images ?? [],
      thumbnail: p.thumbnail ?? (p.images?.[0] ?? ""),
      categoryId: p.category_id ?? "",
      stock: p.stock ?? 0,
      is_active: p.is_active ?? true,
      variants,
    });
  } catch (err) {
    console.error("❌ PRODUCT [ID] ERROR:", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
