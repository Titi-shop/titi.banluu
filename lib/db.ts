// lib/db.ts
import { Pool, type QueryResult } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Safe DB query helper
 * - NO any
 * - NO schema coupling
 * - Caller decides row typing
 */
export async function query<T = unknown>(
  text: string,
  params?: readonly unknown[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}
