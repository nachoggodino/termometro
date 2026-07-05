import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Termómetro de Madrid",
    short_name: "Termómetro",
    description: "Reportes ciudadanos sobre el aire acondicionado del Metro de Madrid.",
    start_url: "/es",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
