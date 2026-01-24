// app/api/upload/route.ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // 🔥 BẮT BUỘC

export async function POST(req: Request) {
  try {
    const filename =
      req.headers.get("x-filename") || `upload-${Date.now()}`;

    if (!req.body) {
      return NextResponse.json(
        { error: "missing_body" },
        { status: 400 }
      );
    }

    const blob = await put(filename, req.body, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { error: "upload_failed" },
      { status: 500 }
    );
  }
}
