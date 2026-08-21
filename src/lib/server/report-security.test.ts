import { createHash } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAbuseKey,
  createNetworkAbuseKey,
  createUndoToken,
  getRateLimitStart,
  getRequestFingerprint,
  getUndoExpiresAt,
  hashUndoToken,
  shouldRequirePersistentStore,
  verifyUndoToken,
} from "./report-security";

describe("report security helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps legacy origin and undo hashes compatible across rolling deploys", () => {
    vi.stubEnv("TERMO_ABUSE_SECRET", "test-abuse-secret");
    const fingerprint = { ip: "203.0.113.8", userAgent: "test-browser" };
    const expectedOrigin = createHash("sha256")
      .update("test-abuse-secret")
      .update(":abuse:")
      .update(fingerprint.ip)
      .update(":")
      .update(fingerprint.userAgent)
      .digest("hex");
    const expectedUndo = createHash("sha256")
      .update("test-abuse-secret")
      .update(":undo:")
      .update("undo-token")
      .digest("hex");

    expect(createAbuseKey(fingerprint)).toBe(expectedOrigin);
    expect(hashUndoToken("undo-token")).toBe(expectedUndo);
  });

  it("derives stable private abuse keys without exposing raw request data", () => {
    const fingerprint = { ip: "203.0.113.8", userAgent: "test-browser" };

    expect(createAbuseKey(fingerprint)).toBe(createAbuseKey(fingerprint));
    expect(createAbuseKey(fingerprint)).not.toContain(fingerprint.ip);
    expect(createAbuseKey(fingerprint)).not.toContain(fingerprint.userAgent);
    expect(createNetworkAbuseKey(fingerprint)).not.toContain(fingerprint.ip);
  });

  it("keeps a network ceiling stable when the User-Agent rotates", () => {
    const first = { ip: "203.0.113.8", userAgent: "browser-a" };
    const second = { ip: "203.0.113.8", userAgent: "browser-b" };

    expect(createAbuseKey(first)).not.toBe(createAbuseKey(second));
    expect(createNetworkAbuseKey(first)).toBe(createNetworkAbuseKey(second));
  });

  it("creates and verifies undo token hashes", () => {
    const token = createUndoToken();
    const hash = hashUndoToken(token);

    expect(token).not.toBe(hash);
    expect(verifyUndoToken(token, hash)).toBe(true);
    expect(verifyUndoToken("wrong-token", hash)).toBe(false);
  });

  it("extracts a request fingerprint from forwarding headers", () => {
    const request = new Request("https://termo.test/api/reports", {
      headers: {
        "x-forwarded-for": "198.51.100.4, 10.0.0.1",
        "user-agent": "playwright",
      },
    });

    expect(getRequestFingerprint(request)).toEqual({
      ip: "198.51.100.4",
      userAgent: "playwright",
    });
  });

  it("computes security windows from the provided clock", () => {
    const now = new Date("2026-07-05T12:00:00Z");

    expect(getRateLimitStart(now).getTime()).toBeLessThan(now.getTime());
    expect(getUndoExpiresAt(now).getTime()).toBeGreaterThan(now.getTime());
  });

  it("requires persistent storage for production-like environments unless memory mode is explicit", () => {
    vi.stubEnv("TERMO_REQUIRE_SUPABASE", "1");
    expect(shouldRequirePersistentStore()).toBe(true);

    vi.stubEnv("TERMO_ALLOW_MEMORY_STORE", "1");
    expect(shouldRequirePersistentStore()).toBe(false);
  });
});
