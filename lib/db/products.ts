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

export type ProductVariant = {
  option1: string;
  option2?: string | null;
  option3?: string | null;
  price: number;
  stock: number;
  sku: string;
};

/** Row đúng theo DB */
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
  variants: ProductVariant[] | null;

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

/** Type dùng trong app */
export type ProductRecord = Omit<
  ProductRow,
  "price" | "sale_price" | "variants"
> & {
  price: number;
  sale_price: number | null;
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

function normalizeVariants(input: unknown): ProductVariant[] {
  if (!Array.isArray(input)) return [];

  return input.map((v) => {
    const item = v as Partial<ProductVariant>;

    return {
      option1: typeof item.option1 === "string" ? item.option1 : "",
      option2: typeof item.option2 === "string" ? item.option2 : null,
      option3: typeof item.option3 === "string" ? item.option3 : null,
      price:
        typeof item.price === "number" && !Number.isNaN(item.price)
          ? item.price
          : 0,
      stock:
        typeof item.stock === "number" && !Number.isNaN(item.stock)
          ? item.stock
          : 0,
      sku: typeof item.sku === "string" ? item.sku : "",
    };
  });
}

function toAppProduct(row: ProductRow): ProductRecord {
  return {
    ...row,
    price: Number(row.price),
    sale_price: row.sale_price !== null ? Number(row.sale_price) : null,
    variants: normalizeVariants(row.variants),
  };
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
  return rows.map(toAppProduct);
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
  return rows.map(toAppProduct);
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
    variants: normalizeVariants(product.variants),
    video_url: null,
    price: toDbPrice(product.price),
    sale_price:
      product.sale_price !== null
        ? toDbPrice(product.sale_price)
        : null,
    currency: null,
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

  return toAppProduct(rows[0]);
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

  if (data.variants !== undefined) {
    payload.variants = normalizeVariants(data.variants);
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
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE UPDATE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_UPDATE_PRODUCT");
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
