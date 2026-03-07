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

/** Row đúng theo DB (price lưu minor unit) */
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

  price: number; // minor unit (int)
  sale_price: number | null; // minor unit (int)
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

/** Type dùng trong app (price dạng decimal) */
export type ProductRecord = Omit<ProductRow, "price" | "sale_price"> & {
  price: number;
  sale_price: number | null;
};

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

function toAppProduct(row: ProductRow): ProductRecord {
  return {
    ...row,
    price: Number((row.price / 100).toFixed(2)),
    sale_price:
      row.sale_price !== null
        ? Number((row.sale_price / 100).toFixed(2))
        : null,
  };
}

function toDbPrice(value: number): number {
  return Math.round(value * 100);
}

/* =========================================================
   GET — ALL ACTIVE PRODUCTS (PUBLIC)
========================================================= */

export async function getAllProducts(): Promise<ProductRecord[]> {
  const url = `${SUPABASE_URL}/rest/v1/products?status=eq.active&deleted_at=is.null&select=*`;

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
  product: Omit<
    ProductRecord,
    "id" | "seller_id" | "created_at" | "updated_at"
  >
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
  return toAppProduct(rows[0]);
}

/* =========================================================
   PATCH — UPDATE PRODUCT BY SELLER
========================================================= */

export async function updateProductBySeller(
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
