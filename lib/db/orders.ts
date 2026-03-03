const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
function headers(): HeadersInit {
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
  product_id: string;
  quantity: number;
  price: number;
  status: string;
  product?: {
    id: string;
    name: string;
    images: string[];
  };
};

export type OrderRecord = {
  id: string;
  status: string;
  total: number;
  created_at: string;
   is_reviewed?: boolean; 
  buyer?: {
    name: string;
    phone: string;
    address: string;
  };
  order_items: OrderItemRecord[];
};

/* =====================================================
   INTERNAL: FETCH PRODUCTS MAP
===================================================== */
async function fetchProductsMap(
  productIds: string[]
): Promise<Record<string, { id: string; name: string; images: string[] }>> {

  if (productIds.length === 0) return {};

  const ids = productIds.map((id) => `"${id}"`).join(",");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=in.(${ids})&select=id,name,images`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return {};

  const products = await res.json() as Array<{
    id: string;
    name: string;
    images: string[] | null;
  }>;

  return Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        images: p.images ?? [],
      },
    ])
  );
}

/* =====================================================
   GET ORDERS BY BUYER
===================================================== */
export async function getOrdersByBuyer(
  buyerPiUid: string
): Promise<OrderRecord[]> {

  /* =========================
     1️⃣ FETCH ORDERS
  ========================= */
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerPiUid}&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      order_items(quantity,price,product_id,status,seller_cancel_reason,seller_message)
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return [];

  const raw = await res.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_cancel_reason: string | null;
      seller_message: string | null;
    }>;
  }>;

  /* =========================
     2️⃣ FETCH REVIEWS
  ========================= */
  const reviewRes = await fetch(
    `${SUPABASE_URL}/rest/v1/reviews?user_pi_uid=eq.${buyerPiUid}&select=order_id`,
    { headers: headers(), cache: "no-store" }
  );

  let reviewedOrderIds: string[] = [];

  if (reviewRes.ok) {
    const reviews = await reviewRes.json() as Array<{ order_id: string }>;
    reviewedOrderIds = reviews.map(r => r.order_id);
  }

  /* =========================
     3️⃣ FETCH PRODUCTS
  ========================= */
  const productIds = Array.from(
    new Set(
      raw.flatMap((o) =>
        o.order_items.map((i) => i.product_id)
      )
    )
  );

  const productsMap = await fetchProductsMap(productIds);

  /* =========================
     4️⃣ RETURN ENRICHED DATA
  ========================= */
  return raw.map((o): OrderRecord => ({
    id: o.id,
    status: o.status,
    total: fromMicroPi(o.total),
    created_at: o.created_at,
    is_reviewed: reviewedOrderIds.includes(o.id), // 👈 thêm dòng này
    order_items: o.order_items.map((i): OrderItemRecord => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
      seller_cancel_reason: i.seller_cancel_reason ?? null,
      seller_message: i.seller_message ?? null,
      product: productsMap[i.product_id],
    })),
  }));
}

/* =====================================================
   GET ORDERS BY SELLER
===================================================== */

export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: "pending" | "confirmed" | "shipping" | "cancelled" | "completed"
): Promise<OrderRecord[]> {

  const itemQuery = new URLSearchParams({
    select: "order_id",
    seller_pi_uid: `eq.${sellerPiUid}`,
  });

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?${itemQuery.toString()}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = await itemsRes.json() as Array<{ order_id: string }>;

  const orderIds = Array.from(new Set(items.map(i => i.order_id)));
  if (orderIds.length === 0) return [];

  const ids = orderIds.map(id => `"${id}"`).join(",");

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      buyer_name,
      buyer_phone,
      buyer_address,
      cancel_reason,
      order_items(quantity,price,product_id,status,seller_pi_uid)
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = await orderRes.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    buyer_name: string | null;
    buyer_phone: string | null;
    buyer_address: string | null;
    cancel_reason: string | null;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_pi_uid: string;
     
    }>;
  }>;

  const productIds = Array.from(
    new Set(
      rawOrders.flatMap(o =>
        o.order_items.map(i => i.product_id)
      )
    )
  );

  const productsMap = await fetchProductsMap(productIds);

  return rawOrders
    .map((o): OrderRecord | null => {

      if (status && o.status !== status) return null;

const sellerItems = o.order_items.filter(
  i => i.seller_pi_uid === sellerPiUid
);

      if (sellerItems.length === 0) return null;

      return {
        id: o.id,
        status: o.status,
        total: fromMicroPi(o.total),
        created_at: o.created_at,
        cancel_reason:
      o.status === "cancelled"
      ? o.cancel_reason ?? null
      : null,
         
        buyer: {
          name: o.buyer_name ?? "",
          phone: o.buyer_phone ?? "",
          address: o.buyer_address ?? "",
        },
        order_items: sellerItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: fromMicroPi(i.price),
          status: i.status,
          product: productsMap[i.product_id],
        })),
      };
    })
    .filter((o): o is OrderRecord => o !== null);
}
/* =====================================================
   CREATE ORDER
===================================================== */
export async function createOrder(params: {
  buyerPiUid: string;
  items: {
    product_id: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  shipping: {
  name: string;
  phone: string;
  address: string;
  province: string;       
  country: string;         
  postal_code?: string | null; 
};
}): Promise<OrderRecord | null> {

  const { buyerPiUid, items, total, shipping } = params;

  /* =========================
     1️⃣ CALCULATE SUBTOTAL
  ========================= */
  const subtotal = items.reduce(
  (sum, i) => sum + i.price * i.quantity,
  0
);

const microSubtotal = toMicroPi(subtotal);
const microTotal = toMicroPi(total);

// 🚨 PROTECT DB CONSTRAINT
if (microSubtotal < 1 || microTotal < 1) {
  console.error("AMOUNT BELOW MINIMUM", {
    subtotal,
    total,
    microSubtotal,
    microTotal,
  });
  return null;
}

  const order_number = `ORD-${Date.now()}`;

  /* =========================
     2️⃣ CREATE ORDER (FIXED)
  ========================= */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
  order_number,
  buyer_id: buyerPiUid,

  subtotal: microSubtotal,
  total: microTotal,

  shipping_name: shipping.name,
  shipping_phone: shipping.phone,
  shipping_address: shipping.address,
  shipping_province: shipping.province,        // ✅ thêm
  shipping_country: shipping.country,          // ✅ thêm
  shipping_postal_code: shipping.postal_code,  // ✅ thêm

  status: "created",
  payment_status: "pending",
  currency: "PI",
}),
    }
  );

  if (!orderRes.ok) {
    console.error("ORDER INSERT ERROR:", await orderRes.text());
    return null;
  }

  const [order] = await orderRes.json() as Array<{ id: string }>;

  if (!order?.id) return null;

  /* =========================
     3️⃣ FETCH SELLER MAP
  ========================= */
  const productIds = items.map(i => `"${i.product_id}"`).join(",");

  const productRes = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=in.(${productIds})&select=id,seller_id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!productRes.ok) {
    console.error(await productRes.text());
    return null;
  }

  const products = await productRes.json() as Array<{
    id: string;
    seller_id: string;
  }>;

  const sellerMap: Record<string, string> =
    Object.fromEntries(products.map(p => [p.id, p.seller_id]));

  /* =========================
     4️⃣ INSERT ORDER ITEMS
  ========================= */
  for (const item of items) {

    const seller = sellerMap[item.product_id];

    if (!seller) continue;

    await fetch(
      `${SUPABASE_URL}/rest/v1/order_items`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          order_id: order.id,
          product_id: item.product_id,
          seller_pi_uid: seller,
          quantity: item.quantity,
          price: toMicroPi(item.price),
          status: "pending",
        }),
      }
    );
  }

  return order as unknown as OrderRecord;
}
/* =====================================================
   GET ORDER DETAIL FOR SELLER
===================================================== */
export async function getOrderByIdForSeller(
  orderId: string,
  sellerPiUid: string
): Promise<OrderRecord | null> {

  /* =========================
     1️⃣ VERIFY SELLER OWNS ITEM
  ========================= */
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=order_id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!verifyRes.ok) return null;

  const verifyItems = await verifyRes.json() as Array<{ order_id: string }>;

  if (verifyItems.length === 0) {
    // Seller không có item trong order này
    return null;
  }

  /* =========================
     2️⃣ FETCH ORDER FULL DATA
  ========================= */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=
      id,
      status,
      total,
      created_at,
      buyer_name,
      buyer_phone,
      buyer_address,
      order_items(quantity,price,product_id,status,seller_pi_uid)
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return null;

  const [rawOrder] = await orderRes.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    buyer_name: string | null;
    buyer_phone: string | null;
    buyer_address: string | null;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_pi_uid: string;
    }>;
  }>;

  if (!rawOrder) return null;

  /* =========================
     3️⃣ FILTER ONLY SELLER ITEMS
  ========================= */
  const sellerItems = rawOrder.order_items.filter(
    i => i.seller_pi_uid === sellerPiUid
  );

  if (sellerItems.length === 0) return null;

  const productIds = Array.from(
    new Set(sellerItems.map(i => i.product_id))
  );

  const productsMap = await fetchProductsMap(productIds);

  return {
    id: rawOrder.id,
    status: rawOrder.status,
    total: fromMicroPi(rawOrder.total),
    created_at: rawOrder.created_at,
    buyer: {
      name: rawOrder.buyer_name ?? "",
      phone: rawOrder.buyer_phone ?? "",
      address: rawOrder.buyer_address ?? "",
    },
    order_items: sellerItems.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
      product: productsMap[i.product_id],
    })),
  };
}
/* =====================================================
   UPDATE ORDER STATUS BY SELLER
===================================================== */
export async function updateOrderStatusBySeller(
  orderId: string,
  sellerPiUid: string,
  newStatus: "confirmed" | "shipping" | "cancelled" | "completed",
  extra?: {
    sellerMessage?: string | null;
    sellerCancelReason?: string | null;
  }
): Promise<boolean> {
  /* =========================
     1️⃣ VERIFY SELLER HAS ITEMS
  ========================= */
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!verifyRes.ok) return false;

  const sellerItems = await verifyRes.json() as Array<{ id: string }>;

  if (sellerItems.length === 0) {
    return false;
  }

  /* =========================
     2️⃣ UPDATE SELLER ITEMS STATUS
  ========================= */
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({
  status: newStatus,
  ...(extra && "sellerMessage" in extra
    ? { seller_message: extra.sellerMessage }
    : {}),
  ...(extra && "sellerCancelReason" in extra
    ? { seller_cancel_reason: extra.sellerCancelReason }
    : {}),
}),
    }
  );

  if (!updateRes.ok) {
    console.error(await updateRes.text());
    return false;
  }

  /* =========================
     3️⃣ OPTIONAL: CHECK IF ALL ITEMS SAME STATUS
     THEN UPDATE ORDER STATUS
  ========================= */

  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&select=status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) return true;

  const allItems = await checkRes.json() as Array<{ status: string }>;

  const allSame = allItems.every(i => i.status === newStatus);

  if (allSame) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          status: newStatus,
        }),
               }
    );
  }

  return true;
}

/* =========================
   COUNT ORDERS BY STATUS
========================= */
export async function getOrdersCountByBuyer(
  buyerPiUid: string
) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerPiUid}&select=status`,
    {
      headers: headers(),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return {
      pending: 0,
      pickup: 0,
      shipping: 0,
      completed: 0,
      returns: 0,
    };
  }

  const rows = await res.json() as Array<{ status: string }>;

  const result = {
  pending: 0,
  pickup: 0,
  shipping: 0,
  completed: 0,
  returns: 0,
};

for (const row of rows) {
  switch (row.status) {
    case "pending":
      result.pending++;
      break;

    case "confirmed":
      result.pickup++;
      break;

    case "shipping":
    case "delivering":
      result.shipping++;
      break;

    case "completed":
  result.completed++;
  break;

    case "cancelled":
    case "returned":
      result.returns++;
      break;
  }
}

  return result;
}

export async function getSellerOrdersCount(
  sellerPiUid: string
) {
  const empty = {
    pending: 0,
    confirmed: 0,
    shipping: 0,
    completed: 0,
    returned: 0,
    cancelled: 0,
    total: 0,
  };

  // 🔥 Lấy toàn bộ order giống route chính
  const orders = await getOrdersBySeller(sellerPiUid);

  for (const order of orders) {
    switch (order.status) {
      case "pending":
      case "confirmed":
      case "shipping":
      case "completed":
      case "returned":
      case "cancelled":
        empty[order.status]++;
        empty.total++;
        break;
      default:
        break;
    }
  }

  return empty;
}

type RawOrderItem = {
  quantity: number;
  price: number;
  product_id: string;
  status: string;
  seller_cancel_reason: string | null;
  seller_message: string | null;
};

type RawOrder = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_address: string | null;
  order_items: RawOrderItem[];
};

export async function getOrderByIdForBuyer(
  orderId: string,
  buyerPiUid: string
): Promise<OrderRecord | null> {
  const select =
    "id,status,total,created_at,buyer_name,buyer_phone,buyer_address," +
    "order_items(quantity,price,product_id,status,seller_cancel_reason,seller_message)";

  const url =
    `${SUPABASE_URL}/rest/v1/orders` +
    `?id=eq.${encodeURIComponent(orderId)}` +
    `&buyer_id=eq.${encodeURIComponent(buyerPiUid)}` +
    `&select=${select}`;

  const res = await fetch(url, {
    headers: headers(),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("SUPABASE ERROR:", await res.text());
    return null;
  }

  const data: RawOrder[] = await res.json();

  if (!data.length) return null;

  const raw = data[0];

  /* =========================
     FETCH PRODUCTS
  ========================= */
  const productIds = [
    ...new Set(raw.order_items.map((i) => i.product_id)),
  ];

  const productsMap = await fetchProductsMap(productIds);

  /* =========================
     RETURN MAPPED DATA
  ========================= */
  return {
    id: raw.id,
    status: raw.status,
    total: fromMicroPi(raw.total),
    created_at: raw.created_at,
    buyer: {
      name: raw.buyer_name ?? "",
      phone: raw.buyer_phone ?? "",
      address: raw.buyer_address ?? "",
    },
    order_items: raw.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
      seller_cancel_reason: i.seller_cancel_reason,
      seller_message: i.seller_message,
      product: productsMap[i.product_id],
    })),
  };
}
