import type { Locale } from "./config";

const platformMessages = {
  es: {
    reportForm: {
      locationType: "¿Dónde estás?",
      carMode: "Coche",
      platformMode: "Andén",
      station: "Estación",
      stationPlaceholder: "Escribe una estación…",
      stationHelp: "Solo puedes elegir estaciones de la línea seleccionada",
      stationRequired: "Selecciona una estación de la línea {line}",
      stationNotOnLine: "Esa estación no pertenece a la línea seleccionada",
    },
    explore: {
      worstPlatforms: "Andenes con más reportes de calor",
      platformLineHeat: "Líneas con más reportes de calor en andenes",
      worstPlatformsTakeaway: "Ordena los andenes por reportes de Calor e Infierno; cada estación se identifica junto a su línea. El filtro de serie de coche no aplica",
      platformLineHeatTakeaway: "Cuenta únicamente reportes de Calor e Infierno enviados desde andenes. El filtro de serie de coche no aplica",
      heatReports: "reportes de calor",
      noPlatformReports: "No hay reportes de calor en andenes para este rango",
      platform: "Andén",
    },
  },
  en: {
    reportForm: {
      locationType: "Where are you?",
      carMode: "Car",
      platformMode: "Platform",
      station: "Station",
      stationPlaceholder: "Type a station…",
      stationHelp: "You can only select stations on the chosen line",
      stationRequired: "Select a station on line {line}",
      stationNotOnLine: "That station is not on the selected line",
    },
    explore: {
      worstPlatforms: "Platforms with the most heat reports",
      platformLineHeat: "Lines with the most platform heat reports",
      worstPlatformsTakeaway: "Ranks platforms by Calor and Infierno reports; each station is shown together with its line. The car-series filter does not apply",
      platformLineHeatTakeaway: "Counts only Calor and Infierno reports submitted from platforms. The car-series filter does not apply",
      heatReports: "heat reports",
      noPlatformReports: "No platform heat reports in this range",
      platform: "Platform",
    },
  },
} as const;

export function getPlatformMessages(locale: Locale) {
  return platformMessages[locale];
}
