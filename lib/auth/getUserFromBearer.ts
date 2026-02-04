import { headers } from "next/headers";
import type { AuthUser } from "./types";

/* =========================================================
   PI AUTH — NETWORK FIRST (CORRECT FOR PI)
========================================================= */
export async function getUserFromBearer(): Promise<AuthUser | null> {
  try {
    const auth = headers().get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = auth.slice(7).trim();
    if (!accessToken) return null;

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

    const data = await res.json();

    if (
      !data ||
      (typeof data.uid !== "string" &&
        typeof data.uid !== "number")
    ) {
      return null;
    }

    return {
      pi_uid: String(data.uid),
      username: data.username ?? "",
      wallet_address: data.wallet_address ?? null,
    };
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      console.warn("⚠️ Pi auth timeout");
      return null;
    }

    console.error("❌ getUserFromBearer error:", err);
    return null;
  }
}
