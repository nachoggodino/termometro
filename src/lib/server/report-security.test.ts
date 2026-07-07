import { describe, expect, it } from "vitest";
import {
  createAbuseKey,
  createUndoToken,
  getRateLimitStart,
  getRequestFingerprint,
  getUndoExpiresAt,
  hashUndoToken,
  verifyUndoToken,
} from "./report-security";

describe("report security helpers", () => {
  it("derives stable private abuse keys without exposing raw request data", () => {
    const fingerprint = { ip: "203.0.113.8", userAgent: "test-browser" };

    expect(createAbuseKey(fingerprint)).toBe(createAbuseKey(fingerprint));
    expect(createAbuseKey(fingerprint)).not.toContain(fingerprint.ip);
    expect(createAbuseKey(fingerprint)).not.toContain(fingerprint.userAgent);
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
});
