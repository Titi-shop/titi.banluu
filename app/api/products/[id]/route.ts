import { NextResponse } from "next/server";

/* =======================
   TYPES
======================= */

interface DBProduct {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  description: string | null;
  images: string[] | null;
  category_id: string | null;
  views: number | null;
  sold: number | null;
}

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  isSale: boolean;
  description: string;
  images: string[];
  categoryId: string | null;
  views: number;
  sold: number;
}

/* =======================
   GET /api/products/[id]
======================= */

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "MISSING_PRODUCT_ID" },
        { status: 400 }
      );
    }

    const SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "FAILED_TO_FETCH_PRODUCT" },
        { status: 500 }
      );
    }

    const rows: DBProduct[] = await res.json();

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const p = rows[0];

    /* =======================
       SALE LOGIC
    ======================= */
    const now = new Date();
    const start = p.sale_start
      ? new Date(p.sale_start)
      : null;
    const end = p.sale_end
      ? new Date(p.sale_end)
      : null;

    const isSale =
      !!p.sale_price &&
      !!start &&
      !!end &&
      now >= start &&
      now <= end;

    const finalPrice = isSale
      ? p.sale_price!
      : p.price;

    const product: ApiProduct = {
      id: p.id,
      name: p.name,
      price: p.price,
      finalPrice,
      isSale,
      description: p.description ?? "",
      images: Array.isArray(p.images) ? p.images : [],
      categoryId: p.category_id,
      views: p.views ?? 0,
      sold: p.sold ?? 0,
    };

    return NextResponse.json(product);
  } catch (err) {
    console.error("❌ GET PRODUCT BY ID ERROR:", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
