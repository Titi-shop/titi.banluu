import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("✅ [Pi APPROVE] yêu cầu phê duyệt từ Pi:", body);

    // Bạn có thể xác thực ở đây (ví dụ: kiểm tra chữ ký Pi)
    // Hoặc chỉ trả về "success" để test

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("❌ Lỗi approve:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
