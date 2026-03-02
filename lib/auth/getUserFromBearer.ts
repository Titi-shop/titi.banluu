import { headers } from "next/headers";
import { query } from "@/lib/db";
import { verifyPiToken } from "./verifyPiToken";

export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

export async function getUserFromBearer(): Promise<AuthUser | null> {
  const headerList = headers();
  const authHeader = headerList.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const piUser = await verifyPiToken(token);
  if (!piUser) return null;

  // Map pi_uid -> users.id
  const { rows } = await query(
    `
    SELECT id, username, role
    FROM users
    WHERE pi_uid = $1
    LIMIT 1
    `,
    [piUser.pi_uid]
  );

  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    username: rows[0].username,
    role: rows[0].role,
  };
}
