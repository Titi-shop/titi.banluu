import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function GET() {
  try {
    const empty = JSON.stringify([], null, 2);
    await put("orders.json", empty, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return NextResponse.json({ success: true, message: "✅ Đã tạo orders.json rỗng" });
  } catch (err: any) {
    console.error("❌ Lỗi tạo orders.json:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
