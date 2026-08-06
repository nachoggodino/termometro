export const MAX_MUTATION_BODY_BYTES = 2_048;

type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415 };

export async function readBoundedJson(request: Request): Promise<JsonBodyResult> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false, status: 415 };
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_MUTATION_BODY_BYTES) {
    return { ok: false, status: 413 };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_MUTATION_BODY_BYTES) {
    return { ok: false, status: 413 };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}
