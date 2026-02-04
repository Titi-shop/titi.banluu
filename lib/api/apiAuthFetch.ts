export async function apiAuthFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = await getPiAccessToken();

  const isFormData = options.body instanceof FormData;

  return fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}
