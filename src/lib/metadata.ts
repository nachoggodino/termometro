const DEFAULT_METADATA_BASE = "http://localhost:3000";

export function getMetadataBase() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  const normalizedUrl = configuredUrl?.startsWith("http") ? configuredUrl : `https://${configuredUrl}`;

  try {
    return new URL(configuredUrl ? normalizedUrl : DEFAULT_METADATA_BASE);
  } catch {
    return new URL(DEFAULT_METADATA_BASE);
  }
}
