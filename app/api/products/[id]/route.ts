import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* =========================
   TYPES
========================= */
type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  images: string[] | null;
  category_id: string | null;
  price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  views: number | null;
  sold: number | null;
};

/* =========================
   GET /api/products/[id]
========================= */
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
      const text = await res.text();
      console.error("❌ FETCH PRODUCT ERROR:", text);
      return NextResponse.json(
        { error: "FAILED_TO_FETCH_PRODUCT" },
        { status: 500 }
      );
    }

    const data: ProductRow[] = await res.json();

    if (data.length === 0) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const p = data[0];

    /* =========================
       SALE LOGIC
    ========================= */
    const now = new Date();
    const start = p.sale_start ? new Date(p.sale_start) : null;
    const end = p.sale_end ? new Date(p.sale_end) : null;

    const isSale =
      !!p.sale_price &&
      !!start &&
      !!end &&
      now >= start &&
      now <= end;

    return NextResponse.json({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      images: p.images ?? [],
      categoryId: p.category_id,
      price: p.price,
      sale_price: p.sale_price,
      isSale,
      finalPrice: isSale ? p.sale_price : p.price,
      views: p.views ?? 0,
      sold: p.sold ?? 0,
    });
  } catch (err) {
    console.error("❌ PRODUCT [ID] ERROR:", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
