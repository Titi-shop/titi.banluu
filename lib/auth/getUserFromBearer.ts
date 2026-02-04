import { headers } from "next/headers";
import type { AuthUser } from "./types";

/* =========================================================
   PI AUTH — AUTH-CENTRIC (NO NETWORK HERE)
========================================================= */
export async function getUserFromBearer(): Promise<AuthUser | null> {
  try {
    const auth = headers().get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = auth.slice(7).trim();
    if (!accessToken) return null;

    // ❗ KHÔNG verify mạng ở đây
    // ❗ Token đã được verify ở /api/pi/verify

    // 👉 Với Pi: uid nằm trong token context,
    // backend dùng token như opaque identity
    return {
      pi_uid: accessToken, // dùng token làm identity key
      username: "",
      wallet_address: null,
    };
  } catch (err) {
    console.error("❌ getUserFromBearer error:", err);
    return null;
  }
}
