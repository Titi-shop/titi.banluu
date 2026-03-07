const SUPABASE_URL = process.env.SUPABASE_URL!;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is missing");
}

/* =========================================================
   TYPES
========================================================= */

type ProductRow = {
  id: string;

  name: string;
  slug: string;

  short_description: string;
  description: string;
  detail: string;

  thumbnail: string | null;
  images: string[];
  detail_images: string[];

  video_url: string | null;

  price: number;
  sale_price: number | null;
  currency: string;

  stock: number;
  is_unlimited: boolean;

  category_id: number | null;

  seller_id: string;

  views: number;
  sold: number;

  rating_avg: number;
  rating_count: number;

  status: "draft" | "active" | "inactive" | "archived" | "banned";

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

export type ProductRecord = Omit<ProductRow, "price" | "sale_price"> & {
  price: number;
  sale_price: number | null;
};

/* =========================================================
   INTERNAL
========================================================= */

function supabaseHeaders(accessToken: string) {
  return {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function toAppProduct(row: ProductRow): ProductRecord {
  return {
    ...row,
    price: Number((row.price / 100000).toFixed(5)),
    sale_price:
      row.sale_price !== null
        ? Number((row.sale_price / 100000).toFixed(5))
        : null,
  };
}

function toDbPrice(value: number): number {
  return Math.round(value * 100000);
}

/* =========================================================
   GET — PUBLIC PRODUCTS
========================================================= */

export async function getAllProducts(
  accessToken: string
): Promise<ProductRecord[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?status=eq.active` +
    `&deleted_at=is.null` +
    `&select=*`;

  const res = await fetch(url, {
    headers: supabaseHeaders(accessToken),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("SUPABASE PRODUCTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_PRODUCTS");
  }

  const rows: ProductRow[] = await res.json();
  return rows.map(toAppProduct);
}

/* =========================================================
   GET — SELLER PRODUCTS
========================================================= */

export async function getSellerProducts(
  accessToken: string,
  sellerPiUid: string
): Promise<ProductRecord[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?seller_id=eq.${encodeURIComponent(sellerPiUid)}` +
    `&deleted_at=is.null` +
    `&select=*`;

  const res = await fetch(url, {
    headers: supabaseHeaders(accessToken),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("SUPABASE SELLER PRODUCTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_SELLER_PRODUCTS");
  }

  const rows: ProductRow[] = await res.json();
  return rows.map(toAppProduct);
}

/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function createProduct(
  accessToken: string,
  sellerPiUid: string,
  product: Omit<ProductRecord, "id" | "seller_id" | "created_at" | "updated_at">
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

  const payload: Omit<ProductRow, "id" | "created_at" | "updated_at"> = {
    ...product,
    price: toDbPrice(product.price),
    sale_price:
      product.sale_price !== null
        ? toDbPrice(product.sale_price)
        : null,
    seller_id: sellerPiUid,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(accessToken),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("CREATE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_CREATE_PRODUCT");
  }

  const rows: ProductRow[] = await res.json();
  return toAppProduct(rows[0]);
}

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export async function updateProductBySeller(
  accessToken: string,
  sellerPiUid: string,
  productId: string,
  data: Partial<
    Pick<
      ProductRecord,
      | "name"
      | "description"
      | "price"
      | "sale_price"
      | "images"
      | "detail_images"
      | "category_id"
      | "sale_start"
      | "sale_end"
      | "status"
    >
  >
): Promise<boolean> {
  const payload: Partial<ProductRow> = { ...data };

  if (data.price !== undefined) {
    payload.price = toDbPrice(data.price);
  }

  if (data.sale_price !== undefined) {
    payload.sale_price =
      data.sale_price !== null
        ? toDbPrice(data.sale_price)
        : null;
  }

  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?id=eq.${encodeURIComponent(productId)}` +
    `&seller_id=eq.${encodeURIComponent(sellerPiUid)}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(accessToken),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("UPDATE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_UPDATE_PRODUCT");
  }

  return true;
}

/* =========================================================
   DELETE PRODUCT (SOFT DELETE)
========================================================= */

export async function deleteProductBySeller(
  accessToken: string,
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
      ...supabaseHeaders(accessToken),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      deleted_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("DELETE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_DELETE_PRODUCT");
  }

  const rows: ProductRow[] = await res.json();
  return rows.length > 0;
}
