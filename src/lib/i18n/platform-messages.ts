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
      worstPlatforms: "Peores andenes",
      platformExplorerTitle: "Explorar andén",
      platformCoverageTitle: "Porcentaje de andenes sin AC",
      worstPlatformsTakeaway: "Ordena los andenes por reportes de Calor e Infierno; cada estación se identifica junto a su línea",
      platformExplorerTakeaway: "El historial de un andén muestra cómo se concentra su señal de calor a lo largo del periodo",
      platformCoverageTakeaway: "Considera sin AC un andén cuando los reportes de Calor e Infierno superan a los de Fresco por más de 5",
      heatReports: "reportes de calor",
      platformCoverageLabel: "de andenes sin AC",
      noPlatformReports: "No hay reportes de calor en andenes para este rango",
      platform: "Andén",
      platformExplorer: {
        label: "Andén",
        placeholder: "Busca un andén reportado",
        search: "Buscar",
        invalid: "El andén no tiene reportes en este periodo",
        empty: "No hay andenes con reportes en este rango",
        totalReports: "Reportes",
        line: "Línea",
        loadError: "No se ha podido cargar el historial. Inténtalo de nuevo.",
      },
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
      worstPlatforms: "Worst platforms",
      platformExplorerTitle: "Explore platform",
      platformCoverageTitle: "Percentage of platforms without AC",
      worstPlatformsTakeaway: "Ranks platforms by Calor and Infierno reports; each station is shown together with its line",
      platformExplorerTakeaway: "A platform history shows how its heat reports are concentrated across the selected period",
      platformCoverageTakeaway: "A platform counts as without AC when Calor and Infierno reports exceed Fresco reports by more than 5",
      heatReports: "heat reports",
      platformCoverageLabel: "of platforms without AC",
      noPlatformReports: "No platform heat reports in this range",
      platform: "Platform",
      platformExplorer: {
        label: "Platform",
        placeholder: "Search a reported platform",
        search: "Search",
        invalid: "The platform has no reports in this period",
        empty: "No platforms have reports in this range",
        totalReports: "Reports",
        line: "Line",
        loadError: "The history could not be loaded. Try again.",
      },
    },
  },
} as const;

export function getPlatformMessages(locale: Locale) {
  return platformMessages[locale];
}
