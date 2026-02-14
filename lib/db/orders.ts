const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Quy ước:
 * 1 Pi = 1_000_000 microPi
 * DB lưu INTEGER (microPi)
 * App hiển thị NUMBER (Pi)
 */
const PI_BASE = 1_000_000;

/* =========================
   PI CONVERTERS
========================= */
function toMicroPi(value: number): number {
  return Math.round(value * PI_BASE);
}

function fromMicroPi(value: number): number {
  return value / PI_BASE;
}

/* =========================
   HEADERS
========================= */
function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================
   TYPES
========================= */
export type OrderItemRecord = {
  quantity: number;
  price: number; // Pi (đã convert)
  product_id: string;
};

export type OrderRecord = {
  id: string;
  status: string;
  total: number; // Pi (đã convert)
  created_at: string;
  order_items: OrderItemRecord[];
};

/* =====================================================
   GET ORDERS BY BUYER (CUSTOMER)
===================================================== */
export async function getOrdersByBuyerSafe(
  piUid: string
): Promise<OrderRecord[]> {
  // 1️⃣ Xác định buyer_id = pi_uid
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${piUid}&select=pi_uid`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) return [];

  const users: Array<{ pi_uid: string }> = await userRes.json();
  const buyerId = users[0]?.pi_uid;
  if (!buyerId) return [];

  // 2️⃣ Lấy orders + order_items
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc&select=id,total,status,created_at,order_items(quantity,price,product_id)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders: Array<{
    id: string;
    total: number;
    status: string;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
    }>;
  }> = await orderRes.json();

  // 3️⃣ Convert microPi → Pi
  return rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  }));
}

/* =====================================================
   GET ORDER BY ID (DETAIL)
===================================================== */
export async function getOrderById(
  orderId: string
): Promise<OrderRecord | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status,total,created_at,order_items(quantity,price,product_id)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const o = data[0];
  if (!o) return null;

  return {
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i: any) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  };
}

/* =====================================================
   CREATE ORDER (CUSTOMER CHECKOUT)
===================================================== */
export async function createOrderSafe({
  buyerPiUid,
  items,
  total,
}: {
  buyerPiUid: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number; // Pi
    seller_pi_uid: string;
  }>;
  total: number; // Pi
}) {
  /* 1️⃣ CREATE ORDER */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        buyer_id: buyerPiUid,
        total: toMicroPi(total),
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) {
    const err = await orderRes.text();
    throw new Error("CREATE_ORDER_FAILED: " + err);
  }

  const orderData = await orderRes.json();
  if (!Array.isArray(orderData) || !orderData[0]) {
    throw new Error("ORDER_NOT_RETURNED");
  }

  const order = orderData[0];

  /* 2️⃣ CREATE ORDER ITEMS */
  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: toMicroPi(i.price),
    seller_pi_uid: i.seller_pi_uid,
    status: "pending",
  }));

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(orderItems),
    }
  );

  if (!itemsRes.ok) {
    const err = await itemsRes.text();
    throw new Error("CREATE_ORDER_ITEMS_FAILED: " + err);
  }

  return {
    id: order.id,
    status: order.status,
    total,
  };
}

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */
export async function updateOrderStatus(
  orderId: string,
  status: string
) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }
  );
}
/* =====================================================
   GET ORDERS BY SELLER (SELLER / ADMIN)
   - Lấy các order có order_items thuộc seller
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: string
): Promise<OrderRecord[]> {
  /* 1️⃣ Lấy order_id theo seller_pi_uid */
  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?select=order_id&seller_pi_uid=eq.${sellerPiUid}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items: Array<{ order_id: string }> = await itemsRes.json();

  const orderIds = Array.from(
    new Set(items.map((i) => i.order_id))
  );

  if (orderIds.length === 0) return [];

  /* 2️⃣ Build filter */
  const ids = orderIds.map((id) => `"${id}"`).join(",");
  const statusFilter = status
    ? `&status=eq.${status}`
    : "";

  /* 3️⃣ Fetch orders + order_items */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})${statusFilter}&order=created_at.desc&select=id,status,total,created_at,order_items(quantity,price,product_id)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders: Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
    }>;
  }> = await orderRes.json();

  /* 4️⃣ Convert microPi → Pi */
  return rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  }));
}
