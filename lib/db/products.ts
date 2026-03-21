const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is missing");
}

if (!SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

import {
  createVariantsForProduct,
  getVariantsByProductId,
  replaceVariantsByProductId,
  type ProductVariant,
} from "@/lib/db/variants";

/* =========================================================
   TYPES
========================================================= */

type ProductRow = {
  id: string;

  name: string;
  slug: string | null;

  short_description: string | null;
  description: string;
  detail: string;

  thumbnail: string | null;
  images: string[];
  detail_images: string[];

  video_url: string | null;

  price: number;
  sale_price: number | null;
  currency: string | null;

  stock: number;
  is_unlimited: boolean;

  category_id: string | null;

  seller_id: string;

  views: number;
  sold: number;

  rating_avg: number;
  rating_count: number;

  is_active: boolean;

  is_featured: boolean;
  is_digital: boolean;

  sale_start: string | null;
  sale_end: string | null;

  meta_title: string | null;
  meta_description: string | null;

  deleted_at: string | null;

  created_at: string;
  updated_at: string | null;
};

export type ProductRecord = ProductRow & {
  variants: ProductVariant[];
};

export type CreateProductInput = {
  name: string;
  description: string;
  detail: string;
  thumbnail: string | null;
  images: string[];
  detail_images?: string[];
  variants?: ProductVariant[];
  price: number;
  sale_price: number | null;
  stock: number;
  category_id: string | null;
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
};

export type UpdateProductInput = Partial<{
  name: string;
  description: string;
  detail: string;
  thumbnail: string | null;
  images: string[];
  detail_images: string[];
  variants: ProductVariant[];
  price: number;
  sale_price: number | null;
  stock: number;
  category_id: string | null;
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
}>;

/* =========================================================
   INTERNAL HELPERS
========================================================= */

function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

function toDbPrice(value: number): number {
  return Number(value);
}

async function toAppProduct(row: ProductRow): Promise<ProductRecord> {
  const variants = await getVariantsByProductId(row.id);

  return {
    ...row,
    price: Number(row.price),
    sale_price: row.sale_price !== null ? Number(row.sale_price) : null,
    variants,
  };
}

async function attachVariants(rows: ProductRow[]): Promise<ProductRecord[]> {
  return await Promise.all(rows.map(toAppProduct));
}

/* =========================================================
   GET — ALL ACTIVE PRODUCTS (PUBLIC)
========================================================= */

export async function getAllProducts(): Promise<ProductRecord[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?is_active=eq.true&deleted_at=is.null&select=*`;

  const res = await fetch(url, {
    headers: supabaseHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE GET PRODUCTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_PRODUCTS");
  }

  const rows: ProductRow[] = await res.json();
  return await attachVariants(rows);
}

/* =========================================================
   GET — PRODUCTS BY SELLER
========================================================= */

export async function getSellerProducts(
  sellerPiUid: string
): Promise<ProductRecord[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?seller_id=eq.${encodeURIComponent(sellerPiUid)}` +
    `&deleted_at=is.null&select=*`;

  const res = await fetch(url, {
    headers: supabaseHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE SELLER PRODUCTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_SELLER_PRODUCTS");
  }

  const rows: ProductRow[] = await res.json();
  return await attachVariants(rows);
}

/* =========================================================
   GET — PRODUCT BY ID
========================================================= */

export async function getProductById(
  productId: string
): Promise<ProductRecord | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?id=eq.${encodeURIComponent(productId)}` +
    `&deleted_at=is.null&select=*`;

  const res = await fetch(url, {
    headers: supabaseHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE GET PRODUCT BY ID ERROR:", text);
    throw new Error("FAILED_TO_FETCH_PRODUCT");
  }

  const rows: ProductRow[] = await res.json();

  if (!rows.length) {
    return null;
  }

  return await toAppProduct(rows[0]);
}

/* =========================================================
   POST — CREATE PRODUCT
========================================================= */

export async function createProduct(
  sellerPiUid: string,
  product: CreateProductInput
): Promise<ProductRecord> {
  if (Number.isNaN(product.price)) {
    throw new Error("INVALID_PRICE");
  }

  if (
    product.sale_price !== null &&
    Number.isNaN(product.sale_price)
  ) {
    throw new Error("INVALID_SALE_PRICE");
  }

  const payload = {
    name: product.name.trim(),
    slug: null,
    short_description: null,
    description: product.description,
    detail: product.detail,
    thumbnail: product.thumbnail,
    images: Array.isArray(product.images) ? product.images : [],
    detail_images: Array.isArray(product.detail_images)
      ? product.detail_images
      : [],
    video_url: null,
    price: toDbPrice(product.price),
    sale_price:
      product.sale_price !== null
        ? toDbPrice(product.sale_price)
        : null,
    currency: "PI",
    stock:
      typeof product.stock === "number" && product.stock >= 0
        ? product.stock
        : 0,
    is_unlimited: false,
    category_id: product.category_id,
    seller_id: sellerPiUid,
    views: 0,
    sold: 0,
    rating_avg: 0,
    rating_count: 0,
    is_active: product.is_active,
    is_featured: false,
    is_digital: false,
    sale_start: product.sale_start,
    sale_end: product.sale_end,
    meta_title: null,
    meta_description: null,
    deleted_at: null,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE CREATE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_CREATE_PRODUCT");
  }

  const rows: ProductRow[] = await res.json();

  if (!rows.length) {
    throw new Error("FAILED_TO_CREATE_PRODUCT");
  }

  const createdRow = rows[0];

  await createVariantsForProduct(
    createdRow.id,
    Array.isArray(product.variants) ? product.variants : [],
    product.price
  );

  return await toAppProduct(createdRow);
}

/* =========================================================
   PATCH — UPDATE PRODUCT BY SELLER
========================================================= */

export async function updateProductBySeller(
  sellerPiUid: string,
  productId: string,
  data: UpdateProductInput
): Promise<boolean> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) {
    payload.name = data.name.trim();
  }

  if (data.description !== undefined) {
    payload.description = data.description;
  }

  if (data.detail !== undefined) {
    payload.detail = data.detail;
  }

  if (data.thumbnail !== undefined) {
    payload.thumbnail = data.thumbnail;
  }

  if (data.images !== undefined) {
    payload.images = Array.isArray(data.images) ? data.images : [];
  }

  if (data.detail_images !== undefined) {
    payload.detail_images = Array.isArray(data.detail_images)
      ? data.detail_images
      : [];
  }

  if (data.price !== undefined) {
    if (Number.isNaN(data.price)) {
      throw new Error("INVALID_PRICE");
    }
    payload.price = toDbPrice(data.price);
  }

  if (data.sale_price !== undefined) {
    if (
      data.sale_price !== null &&
      Number.isNaN(data.sale_price)
    ) {
      throw new Error("INVALID_SALE_PRICE");
    }

    payload.sale_price =
      data.sale_price !== null ? toDbPrice(data.sale_price) : null;
  }

  if (data.stock !== undefined) {
    payload.stock =
      typeof data.stock === "number" && data.stock >= 0 ? data.stock : 0;
  }

  if (data.category_id !== undefined) {
    payload.category_id = data.category_id;
  }

  if (data.sale_start !== undefined) {
    payload.sale_start = data.sale_start;
  }

  if (data.sale_end !== undefined) {
    payload.sale_end = data.sale_end;
  }

  if (data.is_active !== undefined) {
    payload.is_active = data.is_active;
  }

  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?id=eq.${encodeURIComponent(productId)}` +
    `&seller_id=eq.${encodeURIComponent(sellerPiUid)}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE UPDATE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_UPDATE_PRODUCT");
  }

  const rows: ProductRow[] = await res.json();

  if (!rows.length) {
    return false;
  }

  if (data.variants !== undefined) {
    await replaceVariantsByProductId(
      productId,
      data.variants,
      typeof data.price === "number" ? data.price : 0
    );
  }

  return true;
}

/* =========================================================
   PATCH — SOFT DELETE
========================================================= */

export async function deleteProductBySeller(
  sellerPiUid: string,
  productId: string
): Promise<boolean> {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?id=eq.${encodeURIComponent(productId)}` +
    `&seller_id=eq.${encodeURIComponent(sellerPiUid)}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      deleted_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ DELETE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_DELETE_PRODUCT");
  }

  const rows: ProductRow[] = await res.json();
  return rows.length > 0;
}
