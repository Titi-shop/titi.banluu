/* =========================================================
   lib/db/orders.ts
   - Supabase REST
   - Identity: pi_uid
   - NO RBAC here
========================================================= */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* =========================
   TYPES
========================= */
export type BuyerOrderListItem = {
  id: string;
  status: string;
  total: number | null;
  created_at: string;
};

export type CreateOrderItem = {
  product_id: string;
  quantity: number;
  price: number;
};

/* =========================
   INTERNAL
========================= */
function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };
}

/* =========================================================
   GET ORDERS BY BUYER (SAFE)
========================================================= */
export async function getOrdersByBuyer(
  buyerPiUid: string
): Promise<BuyerOrderListItem[]> {
  /* 1️⃣ resolve buyer_id */
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${buyerPiUid}&select=id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) {
    throw new Error("FAILED_TO_RESOLVE_BUYER");
  }

  const users = await userRes.json();
  const buyerId = users[0]?.id;

  if (!buyerId) {
    // bootstrap: chưa có user → chưa có order
    return [];
  }

  /* 2️⃣ query orders */
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&select=id,status,total,created_at&order=created_at.desc`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) {
    const t = await res.text();
    console.error("SUPABASE ORDERS ERROR:", t);
    throw new Error("FAILED_TO_FETCH_BUYER_ORDERS");
  }

  return (await res.json()) as BuyerOrderListItem[];
}

/* =========================================================
   CREATE ORDER
========================================================= */
export async function createOrder(
  buyerPiUid: string,
  items: CreateOrderItem[],
  total: number
) {
  /* 1️⃣ resolve buyer_id */
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${buyerPiUid}&select=id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) {
    throw new Error("BUYER_NOT_FOUND");
  }

  const users = await userRes.json();
  const buyerId = users[0]?.id;

  if (!buyerId) {
    throw new Error("BUYER_NOT_FOUND");
  }

  /* 2️⃣ create order */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: {
        ...headers(),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        buyer_id: buyerId,
        status: "pending",
        total,
      }),
    }
  );

  if (!orderRes.ok) {
    throw new Error("FAILED_TO_CREATE_ORDER");
  }

  const [order] = await orderRes.json();

  /* 3️⃣ create items */
  const rows = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.price,
  }));

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items`,
    {
      method: "POST",
      headers: {
        ...headers(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rows),
    }
  );

  if (!itemsRes.ok) {
    throw new Error("FAILED_TO_CREATE_ORDER_ITEMS");
  }

  return order;
}
