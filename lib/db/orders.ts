/* lib/db/orders.ts */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* =========================
   TYPES
========================= */
export type OrderBuyer = {
  pi_uid: string;
};

export type OrderSeller = {
  pi_uid: string;
};

export type OrderItemProduct = {
  seller: OrderSeller;
};

export type OrderItem = {
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

export type CreateOrderItem = {
  product_id: string;
  quantity: number;
  price: number;
};

/* =========================
   GET ORDER BY ID
========================= */
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
        product:products(
          seller:users!products_seller_id_fkey(
            pi_uid
          )
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

/* =========================
   UPDATE ORDER STATUS
========================= */
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

/* =========================
   GET ORDERS BY BUYER
========================= */
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
    throw new Error("FAILED_TO_FETCH_ORDERS");
  }

  const data = (await res.json()) as Array<
    BuyerOrderListItem & { buyer: { pi_uid: string } }
  >;

  return data.map(({ buyer: _b, ...order }) => order);
}

/* =========================
   CREATE ORDER
========================= */
export async function createOrder(
  buyerPiUid: string,
  items: CreateOrderItem[],
  total: number
) {
  // 1️⃣ Lấy buyer_id
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

  // 2️⃣ Tạo order
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

  // 3️⃣ Tạo order_items
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
