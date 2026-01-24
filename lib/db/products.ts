/* lib/db/products.ts */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 🔥 BẮT BUỘC

if (!SUPABASE_URL) {
  throw new Error("❌ NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!SERVICE_KEY) {
  throw new Error("❌ SUPABASE_SERVICE_ROLE_KEY is missing");
}

/* =========================
   TYPES
========================= */
export type ProductRecord = {
  id: string;
  name: string;
  price: number;

  seller_id: string; // 🔥 pi_uid (TEXT)

  description: string;
  images: string[];
  category_id: number | null;

  views: number;
  sold: number;

  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;

  created_at: string;
  updated_at: string | null;
};

/* =========================
   COMMON HEADERS
========================= */
function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================
   GET — ALL PRODUCTS (PUBLIC)
========================= */
export async function getAllProducts(): Promise<ProductRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=*`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE GET PRODUCTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_PRODUCTS");
  }

  return (await res.json()) as ProductRecord[];
}

/* =========================
   GET — PRODUCTS BY SELLER
   sellerPiUid = users.pi_uid
========================= */
export async function getSellerProducts(
  sellerPiUid: string
): Promise<ProductRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?seller_id=eq.${sellerPiUid}&select=*`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE SELLER PRODUCTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_SELLER_PRODUCTS");
  }

  return (await res.json()) as ProductRecord[];
}

/* =========================
   POST — CREATE PRODUCT
   sellerPiUid = users.pi_uid
========================= */
export async function createProduct(
  sellerPiUid: string,
  product: Omit<
    ProductRecord,
    "id" | "seller_id" | "created_at" | "updated_at"
  >
): Promise<ProductRecord> {
  const payload = {
    ...product,
    seller_id: sellerPiUid, // 🔥 FK → users.pi_uid
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

  const data = await res.json();
  return data[0];
}
