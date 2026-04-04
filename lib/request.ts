type ErrorPayload = {
  error?: string;
  message?: string;
};

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
    if (payload?.error) return payload.error;
    if (payload?.message) return payload.message;
  }

  const text = await response.text().catch(() => "");
  return text || `Request failed with status ${response.status}`;
}

export async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
