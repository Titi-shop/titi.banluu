import { NextResponse } from "next/server";

const COOKIE_NAME = "pi_user";

/**
 * 🧹 API: /api/logout
 * - Xoá session Pi (cookie)
 * - Áp dụng cho Pi Browser + Safari
 * - Logout THẬT sự
 */

export async function POST() {
  try {
    const res = NextResponse.json({
      success: true,
      message: "Đăng xuất thành công",
    });

    // 🔥 XÓA COOKIE SESSION
    res.headers.set(
      "Set-Cookie",
      [
        `${COOKIE_NAME}=deleted`,
        "Path=/",
        "Max-Age=0",
        "HttpOnly",
        "SameSite=None",
        "Secure",
      ].join("; ")
    );

    return res;
  } catch (err: unknown) {
    console.error("❌ Lỗi logout:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi đăng xuất" },
      { status: 500 }
    );
  }
}
