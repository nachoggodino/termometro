import { describe, expect, it } from "vitest";
import { MAX_MUTATION_BODY_BYTES, readBoundedJson } from "./request-json";

function jsonRequest(body: string, headers: HeadersInit = {}) {
  return new Request("https://termo.test/api/reports", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("bounded JSON requests", () => {
  it("parses small JSON bodies", async () => {
    await expect(readBoundedJson(jsonRequest('{"line":"L1"}'))).resolves.toEqual({ ok: true, value: { line: "L1" } });
  });

  it("rejects unsupported content types and malformed JSON", async () => {
    const text = new Request("https://termo.test/api/reports", { method: "POST", body: "{}" });
    await expect(readBoundedJson(text)).resolves.toEqual({ ok: false, status: 415 });
    await expect(readBoundedJson(jsonRequest("{"))).resolves.toEqual({ ok: false, status: 400 });
  });

  it("rejects declared and measured oversized bodies", async () => {
    await expect(readBoundedJson(jsonRequest("{}", { "content-length": String(MAX_MUTATION_BODY_BYTES + 1) }))).resolves.toEqual({ ok: false, status: 413 });
    await expect(readBoundedJson(jsonRequest(JSON.stringify("x".repeat(MAX_MUTATION_BODY_BYTES))))).resolves.toEqual({ ok: false, status: 413 });
  });
});
