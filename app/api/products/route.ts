import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPiAccessToken } from "@/lib/piAuth";

type CreateProductBody = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number | null;
  stock?: number;
  thumbnail?: string | null;
};

export async function GET() {
  try {
    const { rows } = await query(
      `
      select
        id,
        name,
        slug,
        thumbnail,
        price,
        sale_price,
        currency,
        sold,
        rating_avg
      from products
      where status = 'active'
      and deleted_at is null
      order by created_at desc
      limit 50
      `
    );

    return NextResponse.json({
      ok: true,
      products: rows,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "PRODUCT_FETCH_FAILED" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");

    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    const piUser = await verifyPiAccessToken(token);

    if (!piUser) {
      return NextResponse.json(
        { ok: false, error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    const body: CreateProductBody = await req.json();

    if (!body.name || !body.slug || !body.price) {
      return NextResponse.json(
        { ok: false, error: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const price = Math.round(body.price);
    const salePrice = body.sale_price ? Math.round(body.sale_price) : null;

    const { rows } = await query(
      `
      insert into products
      (
        name,
        slug,
        description,
        price,
        sale_price,
        stock,
        thumbnail,
        seller_id,
        status
      )
      values
      (
        $1,$2,$3,$4,$5,$6,$7,$8,'draft'
      )
      returning id
      `,
      [
        body.name,
        body.slug,
        body.description ?? "",
        price,
        salePrice,
        body.stock ?? 0,
        body.thumbnail ?? null,
        piUser.pi_uid,
      ]
    );

    return NextResponse.json({
      ok: true,
      product_id: rows[0].id,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "CREATE_PRODUCT_FAILED" },
      { status: 500 }
    );
  }
}
