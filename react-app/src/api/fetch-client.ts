import { getCSRFToken } from "@/lib/django";

export async function openbaseFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const csrfToken = getCSRFToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (csrfToken && !headers.has("X-CSRFToken")) {
    headers.set("X-CSRFToken", csrfToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("Content-Type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : undefined;

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
}
