import type { MetadataRoute } from "next";
import { THEME_COLORS } from "@/lib/design/tokens";
import { defaultAppCopy } from "@/lib/i18n/app-copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: defaultAppCopy.title,
    short_name: defaultAppCopy.shortName,
    description: defaultAppCopy.description,
    start_url: "/es",
    display: "standalone",
    background_color: THEME_COLORS.lightBackground,
    theme_color: THEME_COLORS.lightBackground,
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
