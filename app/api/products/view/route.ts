import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/* =========================
   TYPES
========================= */
type Product = {
  id: string;
};

/* =========================
   POST — TĂNG VIEW
========================= */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      !("id" in body) ||
      typeof (body as { id: unknown }).id !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Thiếu hoặc sai id" },
        { status: 400 }
      );
    }

    const { id } = body as { id: string };

    // 🔍 Kiểm tra product tồn tại (nhẹ)
    const product = await kv.get<Product>(`product:${id}`);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );
    }

    const viewKey = `product:views:${id}`;

    // ⭐ ATOMIC INCREMENT
    const views = await kv.incr(viewKey);

    return NextResponse.json({
      success: true,
      views,
    });
  } catch (err: unknown) {
    console.error("❌ Lỗi tăng view:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}
