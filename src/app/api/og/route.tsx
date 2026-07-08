import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { SOCIAL_IMAGE_TOKENS } from "@/lib/design/tokens";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { messages as enMessages } from "@/lib/i18n/messages/en";
import { messages as esMessages } from "@/lib/i18n/messages/es";

export async function GET(request: NextRequest) {
  const requestedLocale = request.nextUrl.searchParams.get("lang") ?? undefined;
  const locale = isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const dictionary = locale === "en" ? enMessages : esMessages;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: SOCIAL_IMAGE_TOKENS.background,
          color: SOCIAL_IMAGE_TOKENS.ink,
          padding: SOCIAL_IMAGE_TOKENS.paddingPx,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SOCIAL_IMAGE_TOKENS.logoGapPx,
          }}
        >
          <div
            style={{
              width: SOCIAL_IMAGE_TOKENS.logoContainerPx,
              height: SOCIAL_IMAGE_TOKENS.logoContainerPx,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: SOCIAL_IMAGE_TOKENS.surface,
              border: `${SOCIAL_IMAGE_TOKENS.logoBorderPx}px solid ${SOCIAL_IMAGE_TOKENS.border}`,
              borderRadius: SOCIAL_IMAGE_TOKENS.radiusPx,
            }}
          >
            <div
              style={{
                width: SOCIAL_IMAGE_TOKENS.logoMarkPx,
                height: SOCIAL_IMAGE_TOKENS.logoMarkPx,
                background: SOCIAL_IMAGE_TOKENS.metroRed,
                borderRadius: SOCIAL_IMAGE_TOKENS.markRadiusPx,
                transform: `rotate(${SOCIAL_IMAGE_TOKENS.markRotationDeg}deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: SOCIAL_IMAGE_TOKENS.logoStemWidthPx,
                  height: SOCIAL_IMAGE_TOKENS.logoMarkPx,
                  background: SOCIAL_IMAGE_TOKENS.metroBlue,
                  borderRadius: SOCIAL_IMAGE_TOKENS.pillRadiusPx,
                  border: `${SOCIAL_IMAGE_TOKENS.stemBorderPx}px solid ${SOCIAL_IMAGE_TOKENS.surface}`,
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: SOCIAL_IMAGE_TOKENS.stackGapPx,
            }}
          >
            <div style={{ fontSize: SOCIAL_IMAGE_TOKENS.headerTitlePx, fontWeight: 700 }}>
              {dictionary.common.appName}
            </div>
            <div style={{ color: SOCIAL_IMAGE_TOKENS.muted, fontSize: SOCIAL_IMAGE_TOKENS.headerTextPx }}>
              {dictionary.common.disclaimer}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SOCIAL_IMAGE_TOKENS.sectionGapPx,
            maxWidth: SOCIAL_IMAGE_TOKENS.textMaxWidthPx,
          }}
        >
          <div
            style={{
              width: SOCIAL_IMAGE_TOKENS.accentWidthPx,
              height: SOCIAL_IMAGE_TOKENS.accentHeightPx,
              background: SOCIAL_IMAGE_TOKENS.heatCalor,
              borderRadius: SOCIAL_IMAGE_TOKENS.pillRadiusPx,
            }}
          />
          <div
            style={{
              fontSize: SOCIAL_IMAGE_TOKENS.titlePx,
              fontWeight: 800,
              letterSpacing: SOCIAL_IMAGE_TOKENS.titleTrackingPx,
              lineHeight: SOCIAL_IMAGE_TOKENS.titleLineHeight,
            }}
          >
            {dictionary.meta.socialTitle}
          </div>
          <div
            style={{
              color: SOCIAL_IMAGE_TOKENS.muted,
              fontSize: SOCIAL_IMAGE_TOKENS.descriptionPx,
              lineHeight: SOCIAL_IMAGE_TOKENS.descriptionLineHeight,
            }}
          >
            {dictionary.meta.socialDescription}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: SOCIAL_IMAGE_TOKENS.muted,
            fontSize: SOCIAL_IMAGE_TOKENS.headerTextPx,
          }}
        >
          <span>{dictionary.common.report}</span>
          <span>{dictionary.common.explore}</span>
          <span>{dictionary.common.methodology}</span>
        </div>
      </div>
    ),
    {
      width: SOCIAL_IMAGE_TOKENS.width,
      height: SOCIAL_IMAGE_TOKENS.height,
    },
  );
}
