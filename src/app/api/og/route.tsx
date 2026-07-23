/* eslint-disable @next/next/no-img-element */
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
  const origin = request.nextUrl.origin;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SOCIAL_IMAGE_TOKENS.background,
          color: SOCIAL_IMAGE_TOKENS.ink,
          padding: SOCIAL_IMAGE_TOKENS.paddingPx,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: SOCIAL_IMAGE_TOKENS.logoGapPx,
              border: `${SOCIAL_IMAGE_TOKENS.logoBorderPx}px solid ${SOCIAL_IMAGE_TOKENS.border}`,
              borderRadius: SOCIAL_IMAGE_TOKENS.radiusPx,
              background: SOCIAL_IMAGE_TOKENS.surface,
              padding: SOCIAL_IMAGE_TOKENS.cardPaddingPx,
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
                  position: "relative",
                  width: SOCIAL_IMAGE_TOKENS.logoContainerPx,
                  height: SOCIAL_IMAGE_TOKENS.logoContainerPx,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: SOCIAL_IMAGE_TOKENS.logoMarkPx,
                    height: SOCIAL_IMAGE_TOKENS.logoMarkPx,
                    background: SOCIAL_IMAGE_TOKENS.metroRed,
                    borderRadius: SOCIAL_IMAGE_TOKENS.markRadiusPx,
                    transform: `rotate(${SOCIAL_IMAGE_TOKENS.markRotationDeg}deg)`,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: SOCIAL_IMAGE_TOKENS.logoStemWidthPx,
                    height: SOCIAL_IMAGE_TOKENS.logoMarkPx,
                    display: "flex",
                    borderRadius: SOCIAL_IMAGE_TOKENS.pillRadiusPx,
                    background: SOCIAL_IMAGE_TOKENS.metroBlue,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: `-${SOCIAL_IMAGE_TOKENS.stackGapPx}px`,
                      width: SOCIAL_IMAGE_TOKENS.logoBulbPx,
                      height: SOCIAL_IMAGE_TOKENS.logoBulbPx,
                      border: `${SOCIAL_IMAGE_TOKENS.logoBulbBorderPx}px solid ${SOCIAL_IMAGE_TOKENS.background}`,
                      borderRadius: SOCIAL_IMAGE_TOKENS.pillRadiusPx,
                      background: SOCIAL_IMAGE_TOKENS.metroBlue,
                      transform: "translateX(-50%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: SOCIAL_IMAGE_TOKENS.stackGapPx,
                      width: SOCIAL_IMAGE_TOKENS.logoHighlightWidthPx,
                      height: SOCIAL_IMAGE_TOKENS.logoHighlightHeightPx,
                      borderRadius: SOCIAL_IMAGE_TOKENS.pillRadiusPx,
                      background: SOCIAL_IMAGE_TOKENS.surface,
                      opacity: SOCIAL_IMAGE_TOKENS.logoHighlightOpacity,
                      transform: "translateX(-50%)",
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
                width: SOCIAL_IMAGE_TOKENS.navMenuPx,
                height: SOCIAL_IMAGE_TOKENS.navMenuPx,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: SOCIAL_IMAGE_TOKENS.stackGapPx,
                borderRadius: SOCIAL_IMAGE_TOKENS.radiusPx,
              }}
            >
              {[0, 1, 2].map((line) => (
                <div
                  key={line}
                  style={{
                    width: SOCIAL_IMAGE_TOKENS.navMenuLineWidthPx,
                    height: SOCIAL_IMAGE_TOKENS.navMenuLineHeightPx,
                    background: SOCIAL_IMAGE_TOKENS.ink,
                    borderRadius: SOCIAL_IMAGE_TOKENS.pillRadiusPx,
                  }}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: SOCIAL_IMAGE_TOKENS.sectionGapPx,
              textAlign: "center",
            }}
          >
            <img
              alt=""
              height={SOCIAL_IMAGE_TOKENS.trainHeightPx}
              src={`${origin}/landing-train.svg`}
              style={{
                width: SOCIAL_IMAGE_TOKENS.trainWidthPx,
                height: SOCIAL_IMAGE_TOKENS.trainHeightPx,
                opacity: SOCIAL_IMAGE_TOKENS.trainOpacity,
              }}
              width={SOCIAL_IMAGE_TOKENS.trainWidthPx}
            />
            <div
              style={{
                maxWidth: SOCIAL_IMAGE_TOKENS.textMaxWidthPx,
                color: SOCIAL_IMAGE_TOKENS.muted,
                fontSize: SOCIAL_IMAGE_TOKENS.descriptionPx,
                lineHeight: SOCIAL_IMAGE_TOKENS.descriptionLineHeight,
              }}
            >
              {dictionary.home.mission}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignSelf: "center",
              gap: SOCIAL_IMAGE_TOKENS.actionGapPx,
              width: SOCIAL_IMAGE_TOKENS.actionRowWidthPx,
            }}
          >
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "space-between",
                gap: SOCIAL_IMAGE_TOKENS.logoGapPx,
                background: SOCIAL_IMAGE_TOKENS.heatCalor,
                border: `${SOCIAL_IMAGE_TOKENS.logoBorderPx}px solid ${SOCIAL_IMAGE_TOKENS.heatCalor}`,
                borderRadius: SOCIAL_IMAGE_TOKENS.radiusPx,
                color: SOCIAL_IMAGE_TOKENS.ink,
                padding: `${SOCIAL_IMAGE_TOKENS.actionPaddingBlockPx}px ${SOCIAL_IMAGE_TOKENS.actionPaddingInlinePx}px`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: SOCIAL_IMAGE_TOKENS.stackGapPx }}>
                <span style={{ fontSize: SOCIAL_IMAGE_TOKENS.actionTitlePx, fontWeight: 700 }}>
                  {dictionary.common.report}
                </span>
                <span style={{ fontSize: SOCIAL_IMAGE_TOKENS.actionDescriptionPx, opacity: 0.9 }}>
                  {dictionary.home.reportDescription}
                </span>
              </div>
              <div
                style={{
                  width: SOCIAL_IMAGE_TOKENS.actionIconPx,
                  height: SOCIAL_IMAGE_TOKENS.actionIconPx,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: SOCIAL_IMAGE_TOKENS.ink,
                }}
              >
                <svg height={SOCIAL_IMAGE_TOKENS.actionIconPx} viewBox="0 0 44 44" width={SOCIAL_IMAGE_TOKENS.actionIconPx}>
                  <path d="M22 5 41 38H3L22 5Z" fill="none" stroke={SOCIAL_IMAGE_TOKENS.ink} strokeLinejoin="round" strokeWidth="4" />
                  <path d="M22 16v10" stroke={SOCIAL_IMAGE_TOKENS.ink} strokeLinecap="round" strokeWidth="4" />
                  <circle cx="22" cy="32" fill={SOCIAL_IMAGE_TOKENS.ink} r="2.5" />
                </svg>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "space-between",
                gap: SOCIAL_IMAGE_TOKENS.logoGapPx,
                background: SOCIAL_IMAGE_TOKENS.surface,
                border: `${SOCIAL_IMAGE_TOKENS.logoBorderPx}px solid ${SOCIAL_IMAGE_TOKENS.border}`,
                borderRadius: SOCIAL_IMAGE_TOKENS.radiusPx,
                color: SOCIAL_IMAGE_TOKENS.ink,
                padding: `${SOCIAL_IMAGE_TOKENS.actionPaddingBlockPx}px ${SOCIAL_IMAGE_TOKENS.actionPaddingInlinePx}px`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: SOCIAL_IMAGE_TOKENS.stackGapPx }}>
                <span style={{ fontSize: SOCIAL_IMAGE_TOKENS.actionTitlePx, fontWeight: 700 }}>
                  {dictionary.common.explore}
                </span>
                <span style={{ color: SOCIAL_IMAGE_TOKENS.muted, fontSize: SOCIAL_IMAGE_TOKENS.actionDescriptionPx }}>
                  {dictionary.home.exploreDescription}
                </span>
              </div>
              <div
                style={{
                  width: SOCIAL_IMAGE_TOKENS.actionIconPx,
                  height: SOCIAL_IMAGE_TOKENS.actionIconPx,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: SOCIAL_IMAGE_TOKENS.stackGapPx,
                }}
              >
                <span
                  style={{
                    width: SOCIAL_IMAGE_TOKENS.actionBarWidthPx,
                    height: SOCIAL_IMAGE_TOKENS.actionBarSmPx,
                    borderRadius: SOCIAL_IMAGE_TOKENS.markRadiusPx,
                    background: SOCIAL_IMAGE_TOKENS.heatFresco,
                  }}
                />
                <span
                  style={{
                    width: SOCIAL_IMAGE_TOKENS.actionBarWidthPx,
                    height: SOCIAL_IMAGE_TOKENS.actionBarMdPx,
                    borderRadius: SOCIAL_IMAGE_TOKENS.markRadiusPx,
                    background: SOCIAL_IMAGE_TOKENS.primary,
                  }}
                />
                <span
                  style={{
                    width: SOCIAL_IMAGE_TOKENS.actionBarWidthPx,
                    height: SOCIAL_IMAGE_TOKENS.actionBarLgPx,
                    borderRadius: SOCIAL_IMAGE_TOKENS.markRadiusPx,
                    background: SOCIAL_IMAGE_TOKENS.heatInfierno,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: SOCIAL_IMAGE_TOKENS.width,
      height: SOCIAL_IMAGE_TOKENS.height,
    },
  );
  response.headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return response;
}
