import type { AuthUser } from "./types";

/* =========================================================
   PI AUTH — NETWORK FIRST (SECURE VERSION)
========================================================= */
export async function getUserFromBearer(
  req: Request
): Promise<AuthUser | null> {
  try {
    // ==============================
    // 📌 READ AUTH HEADER
    // ==============================
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) return null;

    const appId = process.env.PI_APP_ID;
    if (!appId) {
      console.error("❌ Missing PI_APP_ID env");
      return null;
    }

    // ==============================
    // ⏳ TIMEOUT CONTROL
    // ==============================
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-PI-APP-ID": appId,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return null;
    }

    const data: unknown = await res.json();

    // ==============================
    // 🔎 STRICT TYPE GUARD
    // ==============================
    if (
      typeof data !== "object" ||
      data === null ||
      !("uid" in data)
    ) {
      return null;
    }

    const maybeUid = (data as { uid?: unknown }).uid;
    const maybeUsername = (data as { username?: unknown }).username;
    const maybeWallet = (data as { wallet_address?: unknown }).wallet_address;

    if (
      (typeof maybeUid !== "string" &&
        typeof maybeUid !== "number")
    ) {
      return null;
    }

    return {
      pi_uid: String(maybeUid),
      username:
        typeof maybeUsername === "string"
          ? maybeUsername
          : "",
      wallet_address:
        typeof maybeWallet === "string"
          ? maybeWallet
          : null,
    };
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name?: string }).name === "AbortError"
    ) {
      console.warn("⚠️ Pi auth timeout");
      return null;
    }

    console.error("❌ getUserFromBearer error:", err);
    return null;
  }
}
