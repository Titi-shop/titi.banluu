import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const filename = req.headers.get("x-filename") || `upload-${Date.now()}`;
    const blob = await put(filename, req.body!, {
      access: "public", // ✅ cho phép truy cập công khai
      addRandomSuffix: true,
    });

    // ✅ Chỉ trả về URL để client dễ dùng
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
  }
}
