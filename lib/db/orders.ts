const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================
   GET ORDERS BY BUYER (SAFE)
   - buyer chưa tồn tại → []
========================= */
export async function getOrdersByBuyerSafe(piUid: string) {
  // 1️⃣ resolve user
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${piUid}&select=id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) return [];

  const users = await userRes.json();
  const buyerId = users[0]?.id;
  if (!buyerId) return [];

  // 2️⃣ get orders
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  return await orderRes.json();
}

/* =========================
   CREATE ORDER (SAFE)
========================= */
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
  // 1️⃣ ensure user exists
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${buyerPiUid}&select=id`,
    { headers: headers(), cache: "no-store" }
  );

  let buyerId: string | null = null;

  if (userRes.ok) {
    const users = await userRes.json();
    buyerId = users[0]?.id ?? null;
  }

  // 👉 BOOTSTRAP: auto create user
  if (!buyerId) {
    const createUserRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users`,
      {
        method: "POST",
        headers: {
          ...headers(),
          Prefer: "return=representation",
        },
        body: JSON.stringify({ pi_uid: buyerPiUid }),
      }
    );

    const [user] = await createUserRes.json();
    buyerId = user.id;
  }

  // 2️⃣ create order
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        buyer_id: buyerId,
        total,
        status: "pending",
      }),
    }
  );

  const [order] = await orderRes.json();

  // 3️⃣ create order items
  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.price,
  }));

  await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(orderItems),
  });

  return order;
}
