export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  });
  let payload: unknown = {};
  try {
    payload = await response.json();
  } catch {
    // An empty or non-JSON response is reported through the status code below.
  }
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string"
      ? payload.message
      : "Request failed";
    throw new ApiError(response.status, message);
  }
  return payload as T;
}
