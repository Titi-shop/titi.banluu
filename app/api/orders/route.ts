import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { query } from "@/lib/db";

export async function GET(
  _req: Request,
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
        o.total,
        o.status,
        o.created_at,

        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.unit_price,
            'product', json_build_object(
              'id', p.id,
              'name', p.name,
              'images', p.images
            )
          )
        ) as order_items

      from orders o
      join order_items oi on oi.order_id = o.id
      left join products p on p.id = oi.product_id

      where o.id = $1
      and o.buyer_id = $2

      group by o.id
      `,
      [params.id, user.pi_uid]
    );

    const order = rows[0];

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);

  } catch (error) {

    console.error("GET ORDER ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
