import { NextResponse } from "next/server";

/**
 * ✅ API xác minh Access Token của Pi Network
 * - Nhận accessToken từ frontend
 * - Gọi Pi API /v2/me hoặc /v2/sandbox/me để xác minh
 */
export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Thiếu accessToken" },
        { status: 400 }
      );
    }

    // ✅ Tự nhận biết môi trường Testnet/Mainnet
    const isSandbox =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
      process.env.PI_API_URL?.includes("/sandbox");

    const API_URL = isSandbox
      ? "https://api.minepi.com/v2/sandbox/me"
      : "https://api.minepi.com/v2/me";

    console.log(
      `🔍 [Pi VERIFY] Xác minh token qua ${isSandbox ? "SANDBOX" : "MAINNET"}:`,
      API_URL
    );

    // 🔹 Gọi Pi API để xác minh accessToken
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Pi VERIFY ERROR]", errorText);
      return NextResponse.json(
        { success: false, message: "Token không hợp lệ hoặc hết hạn" },
        { status: 401 }
      );
    }

    // ✅ Nhận dữ liệu người dùng thật từ Pi Network
    const userData = await response.json();

    const verifiedUser = {
      username: userData?.username,
      uid: userData?.uid,
      roles: userData?.roles || [],
      wallet_address: userData?.wallet_address || null,
      created_at: userData?.created_at || new Date().toISOString(),
    };

    console.log("✅ [Pi VERIFY SUCCESS]:", verifiedUser);

    return NextResponse.json({
      success: true,
      user: verifiedUser,
    });
  } catch (error: any) {
    console.error("💥 [API VERIFY EXCEPTION]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xác minh Pi Network" },
      { status: 500 }
    );
  }
}
