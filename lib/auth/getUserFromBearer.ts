import { headers } from "next/headers";
import type { AuthUser } from "./types";

/* =========================================================
   PI AUTH — NETWORK FIRST (SAFE + STABLE)
========================================================= */
export async function getUserFromBearer(): Promise<AuthUser | null> {
  try {
    // ==============================
    // 📌 READ AUTH HEADER
    // ==============================
    const authHeader = headers().get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) return null;

    const appId = process.env.PI_APP_ID;
    if (!appId) {
      console.error("❌ Missing PI_APP_ID");
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
    // 🔎 STRICT VALIDATION
    // ==============================
    if (
      typeof data !== "object" ||
      data === null ||
      !("uid" in data)
    ) {
      return null;
    }

    const raw = data as {
      uid?: unknown;
      username?: unknown;
      wallet_address?: unknown;
    };

    if (
      raw.uid !== undefined &&
      (typeof raw.uid === "string" || typeof raw.uid === "number")
    ) {
      return {
        pi_uid: String(raw.uid),
        username:
          typeof raw.username === "string"
            ? raw.username
            : "",
        wallet_address:
          typeof raw.wallet_address === "string"
            ? raw.wallet_address
            : null,
      };
    }

    return null;
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
