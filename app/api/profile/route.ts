import { promises as fs } from "fs";
import path from "path";

interface Profile {
  username: string;
  address: string;
  phone: string;
  balance?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("user");
  if (!username) {
    return new Response(JSON.stringify(null), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const profilesPath = path.join(process.cwd(), "data", "profiles.json");
  let profiles: Profile[] = [];

  try {
    const content = await fs.readFile(profilesPath, "utf8");
    profiles = JSON.parse(content);
  } catch {
    profiles = [];
  }

  const found = profiles.find(p => p.username === username) || null;
  return new Response(JSON.stringify(found), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { username, address, phone, balance } = body;

  const profilesPath = path.join(process.cwd(), "data", "profiles.json");
  let profiles: Profile[] = [];
  try {
    const content = await fs.readFile(profilesPath, "utf8");
    profiles = JSON.parse(content);
  } catch {
    profiles = [];
  }

  const idx = profiles.findIndex(p => p.username === username);
  if (idx >= 0) {
    // cập nhật
    profiles[idx] = { username, address, phone, balance };
  } else {
    profiles.push({ username, address, phone, balance });
  }

  await fs.writeFile(profilesPath, JSON.stringify(profiles, null, 2), "utf8");

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
