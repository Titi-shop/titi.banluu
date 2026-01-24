import { NextResponse } from "next/server";

/**
 * 🧾 API: /api/returns
 * - Nhận yêu cầu trả hàng từ khách hàng
 * - Lưu thông tin vào DB hoặc file (hiện tạm log ra console)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, orderId, reason, images } = body;

    if (!username || !orderId || !reason) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin bắt buộc." },
        { status: 400 }
      );
    }

    // 👉 Ở bản thật, bạn sẽ lưu vào DB (ví dụ MongoDB)
    console.log("📦 [YÊU CẦU TRẢ HÀNG]:", { username, orderId, reason, images });

    return NextResponse.json({
      success: true,
      message: "Yêu cầu trả hàng đã được ghi nhận.",
      data: { username, orderId, reason, images },
    });
  } catch (error: any) {
    console.error("❌ [RETURN ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý yêu cầu trả hàng." },
      { status: 500 }
    );
  }
}
