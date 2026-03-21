const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is missing");
}

if (!SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

/* =========================================================
   TYPES
========================================================= */

export type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  stock: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ProductVariant = {
  id?: string;
  sku: string;
  price: number;
  stock: number;
  option1: string;
  option2?: string | null;
  option3?: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

function toAppVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    sku: row.sku,
    price: Number(row.price),
    stock: typeof row.stock === "number" ? row.stock : 0,
    option1: row.option1 ?? "",
    option2: row.option2 ?? null,
    option3: row.option3 ?? null,
  };
}

function normalizeVariant(
  variant: ProductVariant,
  fallbackPrice = 0
): Omit<VariantRow, "id" | "created_at" | "updated_at"> {
  return {
    product_id: "", // sẽ được gán ở hàm create/replace
    sku: typeof variant.sku === "string" ? variant.sku.trim() : "",
    price:
      typeof variant.price === "number" && !Number.isNaN(variant.price)
        ? Number(variant.price)
        : fallbackPrice,
    stock:
      typeof variant.stock === "number" &&
      !Number.isNaN(variant.stock) &&
      variant.stock >= 0
        ? variant.stock
        : 0,
    option1:
      typeof variant.option1 === "string" ? variant.option1.trim() : "",
    option2:
      typeof variant.option2 === "string" && variant.option2.trim() !== ""
        ? variant.option2.trim()
        : null,
    option3:
      typeof variant.option3 === "string" && variant.option3.trim() !== ""
        ? variant.option3.trim()
        : null,
  };
}

/* =========================================================
   GET — VARIANTS BY PRODUCT ID
========================================================= */

export async function getVariantsByProductId(
  productId: string
): Promise<ProductVariant[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/variants` +
    `?product_id=eq.${encodeURIComponent(productId)}` +
    `&order=created_at.asc`;

  const res = await fetch(url, {
    headers: supabaseHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE GET VARIANTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_VARIANTS");
  }

  const rows: VariantRow[] = await res.json();
  return rows.map(toAppVariant);
}

/* =========================================================
   POST — CREATE VARIANTS FOR PRODUCT
========================================================= */

export async function createVariantsForProduct(
  productId: string,
  variants: ProductVariant[],
  fallbackPrice = 0
): Promise<ProductVariant[]> {
  if (!Array.isArray(variants) || variants.length === 0) {
    return [];
  }

  const payload = variants
    .map((variant) => {
      const normalized = normalizeVariant(variant, fallbackPrice);

      return {
        ...normalized,
        product_id: productId,
      };
    })
    .filter((variant) => variant.option1 !== "");

  if (payload.length === 0) {
    return [];
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/variants`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE CREATE VARIANTS ERROR:", text);
    throw new Error("FAILED_TO_CREATE_VARIANTS");
  }

  const rows: VariantRow[] = await res.json();
  return rows.map(toAppVariant);
}

/* =========================================================
   DELETE — ALL VARIANTS BY PRODUCT ID
========================================================= */

export async function deleteVariantsByProductId(
  productId: string
): Promise<boolean> {
  const url =
    `${SUPABASE_URL}/rest/v1/variants` +
    `?product_id=eq.${encodeURIComponent(productId)}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE DELETE VARIANTS ERROR:", text);
    throw new Error("FAILED_TO_DELETE_VARIANTS");
  }

  return true;
}

/* =========================================================
   PUT/PATCH HELPER — REPLACE ALL VARIANTS OF PRODUCT
========================================================= */

export async function replaceVariantsByProductId(
  productId: string,
  variants: ProductVariant[],
  fallbackPrice = 0
): Promise<ProductVariant[]> {
  await deleteVariantsByProductId(productId);

  if (!Array.isArray(variants) || variants.length === 0) {
    return [];
  }

  return await createVariantsForProduct(productId, variants, fallbackPrice);
}
