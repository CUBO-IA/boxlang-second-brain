export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly category = "") {
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
    const fields = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
    throw new ApiError(
      response.status,
      typeof fields.message === "string" ? fields.message : "Request failed",
      typeof fields.category === "string" ? fields.category : "",
    );
  }
  return payload as T;
}
