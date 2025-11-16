import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Giả lập danh sách người được phép (đồng bộ với /api/user-role)
const ALLOWED_USERS = ["titi_shop", "admin_titi", "nguyenminhduc1991111"];

export async function GET(req: Request) {
  try {
    // 🔒 1. Kiểm tra token từ header hoặc query
    const token = req.headers.get("x-pi-username") || new URL(req.url).searchParams.get("token");

    if (!token || !ALLOWED_USERS.includes(token)) {
      return NextResponse.json(
        { success: false, error: "⛔ Bạn không có quyền truy cập API này" },
        { status: 403 }
      );
    }

    // 🔒 2. Nếu hợp lệ, tiếp tục khởi tạo file Blob
    const empty = JSON.stringify([], null, 2);
    await put("orders.json", empty, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    return NextResponse.json({
      success: true,
      message: `✅ ${token} đã tạo file orders.json thành công.`,
    });
  } catch (err: any) {
    console.error("❌ Lỗi tạo orders.json:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
