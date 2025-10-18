import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // req.body có thể là file nếu bạn gửi file raw
  const pathname = req.headers.get("x-filename") || `upload-${Date.now()}`;
  const blob = await put(pathname, req.body, {
    access: "public",
    addRandomSuffix: true,
  });
  return NextResponse.json(blob);
}
