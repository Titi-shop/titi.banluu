import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPiUser } from "@/lib/serverAuth";

export async function GET() {
  try {
    const user = await getPiUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = user.pi_uid;

    const { rows } = await query(
      `
      select
        o.id,
        o.order_number,
        o.created_at,
        o.status,

        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_provider,
        o.shipping_country,
        o.shipping_postal_code,

        sum(oi.total_price)::int as total,

        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'images', oi.images,
            'thumbnail', oi.thumbnail,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'status', oi.status
          )
        ) as items

      from order_items oi
      join orders o
        on o.id = oi.order_id

      where oi.seller_id = $1

      group by
        o.id,
        o.order_number,
        o.created_at,
        o.status,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_provider,
        o.shipping_country,
        o.shipping_postal_code

      order by o.created_at desc
      `,
      [sellerId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("SELLER ORDERS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load seller orders" },
      { status: 500 }
    );
  }
}
