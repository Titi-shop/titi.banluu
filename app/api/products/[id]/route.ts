import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* =========================
   TYPES
========================= */
type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  detail: string | null;
  images: string[] | null;
  thumbnail: string | null;
  category_id: string | null;
  price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  views: number | null;
  sold: number | null;
  stock: number | null;
  is_active: boolean | null;
};

/* =========================
   PATCH /api/products/[id]
========================= */
export async function PATCH(
  req: NextRequest,
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

    const body = await req.json();

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: typeof body.name === "string" ? body.name : "",
          description:
            typeof body.description === "string" ? body.description : "",
          detail: typeof body.detail === "string" ? body.detail : "",
          images: Array.isArray(body.images)
            ? body.images.filter((item: unknown) => typeof item === "string")
            : [],
          category_id:
            typeof body.categoryId === "string" && body.categoryId.trim() !== ""
              ? body.categoryId
              : null,
          price: typeof body.price === "number" ? body.price : 0,
          sale_price:
            typeof body.salePrice === "number" ? body.salePrice : null,
          sale_start:
            typeof body.saleStart === "string" && body.saleStart.trim() !== ""
              ? body.saleStart
              : null,
          sale_end:
            typeof body.saleEnd === "string" && body.saleEnd.trim() !== ""
              ? body.saleEnd
              : null,
          stock:
            typeof body.stock === "number" && body.stock >= 0 ? body.stock : 0,
          is_active:
            typeof body.is_active === "boolean" ? body.is_active : true,
          thumbnail:
            typeof body.thumbnail === "string" ? body.thumbnail : null,
        }),
      }
    );

    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error("❌ PATCH PRODUCT ERROR:", text);
      return NextResponse.json(
        { error: "FAILED_TO_UPDATE_PRODUCT" },
        { status: 500 }
      );
    }

    const data = await updateRes.json();

    return NextResponse.json(data[0]);
  } catch (err) {
    console.error("❌ PRODUCT PATCH ERROR:", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json({
      id: p.id,
      name: p.name,
      price: p.price,

      salePrice: p.sale_price ?? null,
      saleStart: p.sale_start ?? null,
      saleEnd: p.sale_end ?? null,

      description: p.description ?? "",
      detail: p.detail ?? "",

      images: p.images ?? [],
      thumbnail: p.thumbnail ?? (p.images?.[0] ?? ""),

      categoryId: p.category_id ?? "",
      stock: p.stock ?? 0,
      is_active: p.is_active ?? true,
    });
  } catch (err) {
    console.error("❌ PRODUCT [ID] ERROR:", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
