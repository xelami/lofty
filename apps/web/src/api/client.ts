const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1"

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  const body =
    options.body !== undefined && options.body !== null
      ? JSON.stringify(options.body)
      : undefined

  if (body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    body,
    credentials: "include",
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Something went wrong")
  }

  return data
}
