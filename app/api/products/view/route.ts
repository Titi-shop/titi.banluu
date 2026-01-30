import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

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

    // 🔥 ATOMIC UPDATE VIEW
    const res = await fetch(
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
          views: "views + 1",
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ UPDATE VIEW ERROR:", text);
      return NextResponse.json(
        { success: false },
        { status: 500 }
      );
    }

    const [updated] = await res.json();

    return NextResponse.json({
      success: true,
      views: updated.views,
    });
  } catch (err) {
    console.error("❌ VIEW ERROR:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
