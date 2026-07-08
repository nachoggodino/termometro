import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { Toaster } from "sonner";
import { THEME_COLORS } from "@/lib/design/tokens";
import { defaultAppCopy } from "@/lib/i18n/app-copy";
import { getMetadataBase } from "@/lib/metadata";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: defaultAppCopy.title,
  description: defaultAppCopy.description,
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.lightBackground },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.darkBackground },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="antialiased" lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
