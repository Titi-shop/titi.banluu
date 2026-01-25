/* =========================================================
   lib/db/orders.ts
   - Supabase REST API
   - Identity: pi_uid
   - seller_id / buyer_id = users.id
   - SAFE QUERY (NO PGRST100)
========================================================= */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* =========================================================
   TYPES
========================================================= */
export type OrderBuyer = {
  pi_uid: string;
};

export type OrderItemProduct = {
  id: string;
  name: string;
  price: number;
};

export type OrderItem = {
  quantity: number;
  price: number;
  product: OrderItemProduct;
};

export type OrderRecord = {
  id: string;
  status: string;
  total: number | null;
  created_at: string;
  buyer: OrderBuyer;
  items: OrderItem[];
};

export type BuyerOrderListItem = {
  id: string;
  status: string;
  total: number | null;
  created_at: string;
};

export type SellerOrderListItem = {
  orderId: string;
  status: string;
  total: number | null;
  createdAt: string;
};

export type CreateOrderItem = {
  product_id: string;
  quantity: number;
  price: number;
};

/* =========================================================
   GET ORDER BY ID
========================================================= */
export async function getOrderById(
  id: string
): Promise<OrderRecord | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${id}&select=
      id,
      status,
      total,
      created_at,
      buyer:users!orders_buyer_id_fkey(
        pi_uid
      ),
      items:order_items(
        quantity,
        price,
        product:products(
          id,
          name,
          price
        )
      )
    `,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("FAILED_TO_FETCH_ORDER");
  }

  const data = (await res.json()) as OrderRecord[];
  return data[0] ?? null;
}

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */
export async function updateOrderStatus(
  id: string,
  status: string
): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!res.ok) {
    throw new Error("FAILED_TO_UPDATE_ORDER");
  }

  return true;
}

/* =========================================================
   GET ORDERS BY BUYER (pi_uid)
========================================================= */
export async function getOrdersByBuyer(
  buyerPiUid: string
): Promise<BuyerOrderListItem[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=
      id,
      status,
      total,
      created_at,
      buyer:users!orders_buyer_id_fkey(
        pi_uid
      )
    &buyer.pi_uid=eq.${buyerPiUid}
    &order=created_at.desc
    `,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("FAILED_TO_FETCH_BUYER_ORDERS");
  }

  const data = (await res.json()) as Array<
    BuyerOrderListItem & { buyer: { pi_uid: string } }
  >;

  return data.map(({ buyer: _b, ...order }) => order);
}

/* =========================================================
   ✅ GET ORDERS BY SELLER (pi_uid) — FINAL & SAFE
========================================================= */
export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: string
): Promise<SellerOrderListItem[]> {
  /* ----------------------------------
     1️⃣ Resolve seller_id từ pi_uid
  ---------------------------------- */
  const sellerRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${sellerPiUid}&select=id`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!sellerRes.ok) {
    throw new Error("SELLER_NOT_FOUND");
  }

  const sellers = await sellerRes.json();
  const sellerId = sellers[0]?.id;
  if (!sellerId) {
    throw new Error("SELLER_NOT_FOUND");
  }

  /* ----------------------------------
     2️⃣ Query orders qua order_items
     (KHÔNG join lồng → tránh PGRST100)
  ---------------------------------- */
  const statusFilter = status
    ? `&status=eq.${encodeURIComponent(status)}`
    : "";

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=
      id,
      status,
      total,
      created_at
    &id=in.(
      select order_id
      from order_items
      where product_id in (
        select id
        from products
        where seller_id=eq.${sellerId}
      )
    )
    ${statusFilter}
    &order=created_at.desc
    `,
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
    console.error("SUPABASE SELLER ORDERS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_SELLER_ORDERS");
  }

  const rows = (await res.json()) as Array<{
    id: string;
    status: string;
    total: number | null;
    created_at: string;
  }>;

  /* ----------------------------------
     3️⃣ Map CHUẨN cho UI
  ---------------------------------- */
  return rows.map((o) => ({
    orderId: o.id,
    status: o.status,
    total: o.total,
    createdAt: o.created_at,
  }));
}

/* =========================================================
   CREATE ORDER
========================================================= */
export async function createOrder(
  buyerPiUid: string,
  items: CreateOrderItem[],
  total: number
) {
  /* -------------------------
     1️⃣ Resolve buyer_id
  ------------------------- */
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${buyerPiUid}&select=id`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (!userRes.ok) {
    throw new Error("BUYER_NOT_FOUND");
  }

  const users = await userRes.json();
  const buyerId = users[0]?.id;
  if (!buyerId) {
    throw new Error("BUYER_NOT_FOUND");
  }

  /* -------------------------
     2️⃣ Create order
  ------------------------- */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        buyer_id: buyerId,
        total,
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) {
    throw new Error("FAILED_TO_CREATE_ORDER");
  }

  const [order] = await orderRes.json();

  /* -------------------------
     3️⃣ Create order items
  ------------------------- */
  const orderItems = items.map((i) => ({
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
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderItems),
    }
  );

  if (!itemsRes.ok) {
    throw new Error("FAILED_TO_CREATE_ORDER_ITEMS");
  }

  return order;
}
