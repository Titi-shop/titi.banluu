import { headers } from "next/headers";
import { query } from "@/lib/db";
import type { AuthUser } from "./types";

export async function getUserFromBearer(): Promise<AuthUser | null> {
  try {
    const auth = headers().get("authorization");
    if (!auth?.startsWith("Bearer ")) return null;

    const accessToken = auth.slice(7).trim();
    if (!accessToken) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-PI-APP-ID": process.env.PI_APP_ID!,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!data || typeof data !== "object" || !("uid" in data)) {
      return null;
    }

    const { uid, username } = data as {
      uid: string | number;
      username?: string;
    };

    const pi_uid = String(uid);

    /* MAP pi_uid → users.id */
    const { rows } = await query(
      `
      SELECT id, role
      FROM users
      WHERE pi_uid = $1
      LIMIT 1
      `,
      [pi_uid]
    );

    if (rows.length === 0) return null;

    return {
      id: rows[0].id,
      username: username ?? "",
      role: rows[0].role,
    };
  } catch {
    return null;
  }
}
