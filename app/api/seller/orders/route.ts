import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPiToken } from "@/lib/piAuth";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const token = auth.replace("Bearer ", "");
  const user = await verifyPiToken(token);

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const params: unknown[] = [user.pi_uid];

  let statusFilter = "";

  if (status) {
    statusFilter = "and oi.status = $2";
    params.push(status);
  }

  const { rows } = await query(
    `
    select
      o.id,
      o.created_at,
      o.total_price as total,

      json_build_object(
        'name', o.buyer_name,
        'phone', o.buyer_phone,
        'address', o.buyer_address
      ) as buyer,

      json_agg(
        json_build_object(
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.unit_price,
          'product', json_build_object(
            'id', oi.product_id,
            'name', oi.product_name,
            'images', oi.images
          )
        )
      ) as order_items

    from order_items oi
    join orders o on o.id = oi.order_id

    where oi.seller_id = $1
    ${statusFilter}

    group by o.id
    order by o.created_at desc
    `
    ,
    params
  );

  return NextResponse.json(rows);
}
