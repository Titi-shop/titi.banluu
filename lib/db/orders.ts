const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =====================================================
   TYPES (CHO API /orders/[id])
===================================================== */

export type OrderRecord = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer: {
    pi_uid: string;
  };
  items: Array<{
    quantity: number;
    price: number;
    product: {
      seller: {
        pi_uid: string;
      };
    };
  }>;
};

/* =====================================================
   GET ORDER BY ID (FULL JOIN)
===================================================== */
export async function getOrderById(
  orderId: string
): Promise<OrderRecord | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=
      id,
      status,
      total,
      created_at,
      buyer:buyer_id(pi_uid),
      items:order_items(
        quantity,
        price,
        product:product_id(
          seller:seller_id(pi_uid)
        )
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data[0] ?? null;
}
/* =====================================================
   GET ORDERS BY SELLER
   - Chỉ lấy đơn có sản phẩm của seller
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string
) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=
      id,
      status,
      total,
      created_at,
      buyer:buyer_id(pi_uid),
      items:order_items(
        quantity,
        price,
        product:product_id(
          seller:seller_id(pi_uid)
        )
      )
      &items.product.seller.pi_uid=eq.${sellerPiUid}
      &order=created_at.desc
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return [];

  return await res.json();
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
   EXISTING FUNCTIONS (GIỮ NGUYÊN)
===================================================== */

export async function getOrdersByBuyerSafe(piUid: string) {
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${piUid}&select=pi_uid`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) return [];

  const users = await userRes.json();
  const buyerId = users[0]?.pi_uid;
  if (!buyerId) return [];

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  return await orderRes.json();
}

export async function createOrderSafe({
  buyerPiUid,
  items,
  total,
}: {
  buyerPiUid: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
  total: number;
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
        total,
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) {
    const err = await orderRes.text();
    throw new Error("CREATE_ORDER_FAILED: " + err);
  }

  const orderData = await orderRes.json();

  // ✅ FIX CHÍNH Ở ĐÂY
  if (!Array.isArray(orderData) || !orderData[0]) {
    throw new Error("ORDER_NOT_RETURNED");
  }

  const order = orderData[0];

  /* 2️⃣ CREATE ORDER ITEMS */
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
      headers: headers(),
      body: JSON.stringify(orderItems),
    }
  );

  if (!itemsRes.ok) {
    const err = await itemsRes.text();
    throw new Error("CREATE_ORDER_ITEMS_FAILED: " + err);
  }

  return order;
}
