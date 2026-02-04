export async function apiAuthFetch(
  input: RequestInfo,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers);

  // ✅ Ưu tiên token sẵn có
  if (!headers.has("Authorization")) {
    const token = await getPiAccessToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
