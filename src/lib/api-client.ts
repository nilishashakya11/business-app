/** Thin fetch wrapper for client components. Throws on non-2xx with the API error message. */
export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && (body as { error: string }).error) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}
