import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPiAccessToken } from "@/lib/piAuth";

/* =========================================================
   TYPES
========================================================= */

type OrderRow = {
  id: string;
  buyer_id: string;
  status: string;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  seller_id: string;

  product_name: string;
  product_slug: string | null;

  thumbnail: string;
  images: string[] | null;

  unit_price: number;
  quantity: number;
  total_price: number;

  status: string;

  tracking_code: string | null;
  shipped_at: string | null;
  delivered_at: string | null;

  seller_message: string | null;
  seller_cancel_reason: string | null;

  created_at: string;
};

type OrderResponse = {
  id: string;
  status: string;
  created_at: string;
  items: OrderItemRow[];
  total_price: number;
};

/* =========================================================
   AUTH
========================================================= */

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = auth.replace("Bearer ", "");

  const user = await verifyPiAccessToken(token);

  if (!user) {
    throw new Error("INVALID_TOKEN");
  }

  return user;
}

/* =========================================================
   GET /api/orders
   - buyer: list orders
   - seller: list orders containing seller items
========================================================= */

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);

    const url = new URL(req.url);
    const sellerView = url.searchParams.get("seller") === "true";

    let orders: OrderRow[] = [];

    if (sellerView) {
      orders = await query<OrderRow>(
        `
        select distinct o.*
        from orders o
        join order_items i on i.order_id = o.id
        where i.seller_id = $1
        order by o.created_at desc
        `,
        [user.pi_uid]
      );
    } else {
      orders = await query<OrderRow>(
        `
        select *
        from orders
        where buyer_id = $1
        order by created_at desc
        `,
        [user.pi_uid]
      );
    }

    const orderIds = orders.map((o) => o.id);

    if (orderIds.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const items = await query<OrderItemRow>(
      `
      select *
      from order_items
      where order_id = any($1)
      order by created_at asc
      `,
      [orderIds]
    );

    const map = new Map<string, OrderItemRow[]>();

    for (const item of items) {
      if (!map.has(item.order_id)) {
        map.set(item.order_id, []);
      }

      map.get(item.order_id)!.push(item);
    }

    const result: OrderResponse[] = orders.map((order) => {
      const orderItems = map.get(order.id) ?? [];

      const total = orderItems.reduce(
        (sum, item) => sum + item.total_price,
        0
      );

      return {
        id: order.id,
        status: order.status,
        created_at: order.created_at,
        items: orderItems,
        total_price: total,
      };
    });

    return NextResponse.json({
      orders: result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
}
