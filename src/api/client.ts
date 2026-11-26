export const API_BASE_URL = import.meta.env.VITE_FINVERSE_API_URL || "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  /** Serialized as JSON with the matching Content-Type. */
  json?: unknown;
  body?: BodyInit;
};

/** Calls the Finverse API (`/api/v1` + path), parsing JSON and throwing ApiError on non-2xx. */
export async function apiRequest<T = void>(path: string, { json, headers, ...options }: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : options.body,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) throw new ApiError(response.status, data);

  return data as T;
}
