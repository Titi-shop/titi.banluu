import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✅ [Pi APPROVE] yêu cầu phê duyệt:", body);

    // Phản hồi nhanh cho Pi Wallet
    return NextResponse.json({ status: "completed" }, { status: 200 });
  } catch (err) {
    console.error("❌ Lỗi approve:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
