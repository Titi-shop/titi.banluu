import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { toMinorUnit } from "@/lib/pi";

export const dynamic = "force-dynamic";

const PI_API = process.env.PI_API_URL!;
const PI_KEY = process.env.PI_API_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const paymentId = body.paymentId;
    const txid = body.txid;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    /* =========================
       COMPLETE PI PAYMENT
    ========================= */

    const piRes = await fetch(
      `${PI_API}/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
        cache: "no-store",
      }
    );

    const text = await piRes.text();

    if (!piRes.ok) {
      console.error("PI COMPLETE FAIL:", text);
    }


     /* LOAD PRODUCT FROM DB */

    const { rows } = await query(
`
select id,name,seller_id,images,price
from products
where id=$1
`,
[body.product_id]
);

    const product = rows[0];

    if (!product) {
      console.error("PRODUCT NOT FOUND");
      return;
    }

    /* =========================
       CREATE ORDER (SAFE)
    ========================= */

    if (piRes.ok) {
  try {

    const shipping = body.shipping ?? {};
    const user = body.user ?? {};
    const quantity = body.quantity ?? 1;

    if (!user.pi_uid) {
  console.error("INVALID USER");
  return;
}
    

const subtotal = toMinorUnit(product.price * quantity);
const total = subtotal;

    /* CREATE ORDER */

    const { rows: orderRows } = await query(
`
insert into orders (
  order_number,
  buyer_id,
  pi_payment_id,
  pi_txid,
  subtotal,
  total,
  shipping_name,
  shipping_phone,
  shipping_address,
  shipping_country,
  shipping_postal_code
)
values (
  gen_random_uuid()::text,
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
)
on conflict (pi_payment_id) do nothing
returning id
`,
[
  user.pi_uid,
  paymentId,
  txid,
  subtotal,
  total,
  shipping.name ?? "",
  shipping.phone ?? "",
  shipping.address_line ?? "",
  shipping.country ?? "",
  shipping.postal_code ?? ""
]
);
    
const orderId = orderRows[0]?.id;

if (!orderId) {
  console.error("ORDER NOT CREATED");
  return;
}
    
   
    /* CREATE ORDER ITEM */

    await query(
`
insert into order_items (
  order_id,
  product_id,
  seller_id,
  product_name,
  thumbnail,
  images,
  unit_price,
  quantity,
  total_price
)
values (
  $1,$2,$3,$4,$5,$6,$7,$8,$9
)
`,
[
  orderId,
  product.id,
  product.seller_id,
  product.name,
  product.images?.[0] ?? "",
  product.images ?? [],
  toMinorUnit(product.price),
quantity,
toMinorUnit(product.price * quantity)
]
);

  } catch (e) {
    console.error("ORDER CREATE FAIL:", e);
  }
}
        return new NextResponse(text || "{}", {
      status: piRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (err) {
    console.error("PI COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
