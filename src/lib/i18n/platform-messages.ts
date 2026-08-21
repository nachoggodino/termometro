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
      platformCoverageTakeaway:
        "Un andén se considera sin AC cuando, en el rango seleccionado, los reportes de Calor e Infierno superan a los de Fresco por más de {threshold}",
      heatReports: "reportes de calor",
      platformCoverageLabel: "de andenes sin AC",
      noPlatformReports: "No hay reportes de calor en andenes para este rango",
      platform: "Andén",
      platformExplorer: {
        label: "Estación",
        placeholder: "Busca una estación reportada",
        invalid: "La estación no tiene reportes en este periodo",
        empty: "No hay estaciones con reportes en este rango",
        totalReports: "Reportes",
        reportedLines: "Líneas reportadas",
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
      platformCoverageTakeaway:
        "A platform counts as without AC when, in the selected range, Calor and Infierno reports exceed Fresco reports by more than {threshold}",
      heatReports: "heat reports",
      platformCoverageLabel: "of platforms without AC",
      noPlatformReports: "No platform heat reports in this range",
      platform: "Platform",
      platformExplorer: {
        label: "Station",
        placeholder: "Search a reported station",
        invalid: "The station has no reports in this period",
        empty: "No stations have reports in this range",
        totalReports: "Reports",
        reportedLines: "Reported lines",
        loadError: "The history could not be loaded. Try again.",
      },
    },
  },
} as const;

export function getPlatformMessages(locale: Locale) {
  return platformMessages[locale];
}
