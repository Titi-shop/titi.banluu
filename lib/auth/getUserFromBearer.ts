

import { headers } from "next/headers";
import type { AuthUser } from "./types";

/* =========================================================
   PI AUTH — NETWORK FIRST
========================================================= */
export async function getUserFromBearer(): Promise<AuthUser | null> {
  try {
    const auth = headers().get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = auth.slice(7).trim();
    if (!accessToken) return null;

    // ⏱️ TIMEOUT — Pi Browser safe
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return null;

    const raw: unknown = await res.json();

    /* =========================
       TYPE GUARD (NO any)
    ========================= */
    if (typeof raw !== "object" || raw === null) {
      return null;
    }

    const data = raw as {
      uid?: unknown;
      username?: unknown;
      wallet_address?: unknown;
    };

    if (
      (typeof data.uid !== "string" &&
        typeof data.uid !== "number") ||
      (data.username !== undefined &&
        typeof data.username !== "string") ||
      (data.wallet_address !== undefined &&
        typeof data.wallet_address !== "string")
    ) {
      return null;
    }

    return {
      pi_uid: String(data.uid),
      username: data.username ?? "",
      wallet_address: data.wallet_address ?? null,
      // ❌ KHÔNG gắn role ở auth layer
    };
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name: string }).name === "AbortError"
    ) {
      console.warn("⚠️ Pi auth timeout");
      return null;
    }

    console.error("❌ getUserFromBearer error:", err);
    return null;
  }
}
