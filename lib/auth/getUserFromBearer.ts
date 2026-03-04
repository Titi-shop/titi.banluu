import { headers } from "next/headers";
import type { AuthUser } from "./types";

/* =========================================================
   PI AUTH — NETWORK FIRST (NO APP_ID)
   - Verify directly with Pi /v2/me
   - AccessToken only
========================================================= */
export async function getUserFromBearer(): Promise<AuthUser | null> {
  try {
    /* =========================
       1️⃣ READ AUTH HEADER
    ========================= */
    const authHeader = headers().get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) {
      return null;
    }

    /* =========================
       2️⃣ VERIFY WITH PI
    ========================= */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();

    /* =========================
       3️⃣ STRICT TYPE CHECK
    ========================= */
    if (
      !data ||
      typeof data !== "object" ||
      !("uid" in data)
    ) {
      return null;
    }

    const {
      uid,
      username,
      wallet_address,
    } = data as {
      uid: string | number;
      username?: string;
      wallet_address?: string | null;
    };

    if (!uid) return null;

    /* =========================
       4️⃣ RETURN AUTH USER
    ========================= */
    return {
      pi_uid: String(uid),
      username: typeof username === "string" ? username : "",
      wallet_address:
        typeof wallet_address === "string"
          ? wallet_address
          : null,
    };

  } catch (error) {
    if ((error as { name?: string })?.name === "AbortError") {
      console.warn("⚠️ Pi auth timeout");
      return null;
    }

    console.error("❌ getUserFromBearer error:", error);
    return null;
  }
}
