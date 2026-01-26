// lib/apiFetch.ts
"use client";

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("pi_access_token")
      : null;

  if (!token) {
    throw new Error("NO_PI_TOKEN");
  }

  const isJson =
    options.body &&
    typeof options.body === "string";

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(isJson ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
}
