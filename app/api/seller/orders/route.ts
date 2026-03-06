import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/* =========================================================
   TYPES
========================================================= */

type OrderRow = {
  order_id: string;
  created_at: string;
  status: string;

  item_id: string;
  quantity: number;
  price_pi: number;

  product_id: string;
  product_name: string;
  product_image: string | null;

  buyer_uid: string;
  buyer_username: string;
};

/* =========================================================
   GET SELLER ORDERS
========================================================= */

export async function GET(req: NextRequest) {
  try {
    const seller = req.nextUrl.searchParams.get("seller");

    if (!seller) {
      return NextResponse.json(
        { error: "Missing seller username" },
        { status: 400 }
      );
    }

    const rows = await query<OrderRow>(
      `
      SELECT
        o.id            AS order_id,
        o.created_at,
        o.status,

        oi.id           AS item_id,
        oi.quantity,
        oi.price_pi,

        p.id            AS product_id,
        p.name          AS product_name,
        p.image         AS product_image,

        u.pi_uid        AS buyer_uid,
        u.username      AS buyer_username

      FROM order_items oi
      JOIN orders o        ON o.id = oi.order_id
      JOIN products p      ON p.id = oi.product_id
      JOIN users u         ON u.pi_uid = o.buyer_uid

      WHERE p.seller_username = $1

      ORDER BY o.created_at DESC
      `,
      [seller]
    );

    const map = new Map<
      string,
      {
        id: string;
        created_at: string;
        status: string;
        buyer: {
          pi_uid: string;
          username: string;
        };
        items: {
          id: string;
          quantity: number;
          price_pi: number;
          product: {
            id: string;
            name: string;
            image: string | null;
          };
        }[];
      }
    >();

    for (const r of rows) {
      if (!map.has(r.order_id)) {
        map.set(r.order_id, {
          id: r.order_id,
          created_at: r.created_at,
          status: r.status,
          buyer: {
            pi_uid: r.buyer_uid,
            username: r.buyer_username,
          },
          items: [],
        });
      }

      map.get(r.order_id)!.items.push({
        id: r.item_id,
        quantity: r.quantity,
        price_pi: r.price_pi,
        product: {
          id: r.product_id,
          name: r.product_name,
          image: r.product_image,
        },
      });
    }

    return NextResponse.json({
      orders: Array.from(map.values()),
    });
  } catch (error) {
    console.error("seller orders error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
