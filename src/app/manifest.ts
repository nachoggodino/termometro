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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
