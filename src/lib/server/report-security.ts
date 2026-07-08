import { createHash, randomBytes, timingSafeEqual } from "crypto";
import {
  RATE_LIMIT_WINDOW_MINUTES,
  UNDO_WINDOW_SECONDS,
} from "../domain/reports";

export type RequestFingerprint = {
  ip: string;
  userAgent: string;
};

export const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_MINUTES * 60_000;
export const UNDO_WINDOW_MS = UNDO_WINDOW_SECONDS * 1_000;

export function shouldRequirePersistentStore() {
  return process.env.TERMO_ALLOW_MEMORY_STORE !== "1" && (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.TERMO_REQUIRE_SUPABASE === "1"
  );
}

function getAbuseSecret() {
  const secret = process.env.TERMO_ABUSE_SECRET;
  if (secret) return secret;
  if (shouldRequirePersistentStore()) {
    throw new Error("TERMO_ABUSE_SECRET is required in this environment.");
  }
  return "development-only-abuse-secret";
}

export function getRequestFingerprint(request: Request): RequestFingerprint {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwardedFor || request.headers.get("x-real-ip") || "local",
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}

export function createAbuseKey(fingerprint: RequestFingerprint) {
  return createHash("sha256")
    .update(getAbuseSecret())
    .update(":abuse:")
    .update(fingerprint.ip)
    .update(":")
    .update(fingerprint.userAgent)
    .digest("hex");
}

export function createUndoToken() {
  return randomBytes(24).toString("base64url");
}

export function hashUndoToken(token: string) {
  return createHash("sha256").update(getAbuseSecret()).update(":undo:").update(token).digest("hex");
}

export function verifyUndoToken(token: string, expectedHash: string | null | undefined) {
  if (!token || !expectedHash) return false;
  const actual = Buffer.from(hashUndoToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function getUndoExpiresAt(now = new Date()) {
  return new Date(now.getTime() + UNDO_WINDOW_MS);
}

export function getRateLimitStart(now = new Date()) {
  return new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
}
