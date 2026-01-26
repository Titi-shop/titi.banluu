/* =========================================================
   lib/auth/getUserFromBearer.ts
   - NETWORK–FIRST Pi Auth
   - Bearer token only
   - Shared auth helper (Phase 1 Bootstrap)
========================================================= */

import { headers } from "next/headers";
import type { AuthUser } from "./types";

/* /* =========================================================
   VERIFY PI TOKEN FROM AUTHORIZATION HEADER
========================================================= */
export async function getUserFromBearer(): Promise<AuthUser | null> {
  try {
    const authHeader = headers().get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) return null;

    const res = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data: unknown = await res.json();

    // 🔒 TYPE GUARD — NO any
    if (
      typeof data !== "object" ||
      data === null ||
      !("uid" in data)
    ) {
      return null;
    }

    const uid = (data as { uid: unknown }).uid;
    if (typeof uid !== "string" && typeof uid !== "number") {
      return null;
    }

    const username =
      typeof (data as { username?: unknown }).username === "string"
        ? (data as { username?: string }).username
        : "";

    const wallet_address =
      typeof (data as { wallet_address?: unknown }).wallet_address === "string"
        ? (data as { wallet_address?: string }).wallet_address
        : null;

    return {
      pi_uid: String(uid),
      username,
      wallet_address,
      role: "CUSTOMER", // default, sẽ resolve RBAC sau
    };
  } catch (err) {
    console.error("❌ getUserFromBearer error:", err);
    return null;
  }
}
