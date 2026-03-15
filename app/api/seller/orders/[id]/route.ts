import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const { rows } = await query(
      `
      select
        o.id,
        o.order_number,
        o.created_at,

        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_provider,
        o.shipping_country,
        o.shipping_postal_code,

        coalesce(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'thumbnail', oi.thumbnail,
              'images', oi.images,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'status', oi.status,
              'tracking_code', oi.tracking_code,
              'seller_message', oi.seller_message
            )
          ) filter (where oi.id is not null),
          '[]'
        ) as order_items,

        coalesce(sum(oi.total_price),0) as total

      from orders o

      join order_items oi
      on oi.order_id = o.id

      where o.id = $1
      and oi.seller_id = $2

      group by
        o.id,
        o.order_number,
        o.created_at,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_provider,
        o.shipping_country,
        o.shipping_postal_code
      `,
      [params.id, user.pi_uid]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);

  } catch (error) {

    console.error("SELLER ORDER ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );

  }
}
