import type { MetroLine } from "./lines";

export type MetroStation = {
  id: string;
  line: MetroLine;
  name: string;
  sortOrder: number;
};

// Curated from CRTM current Metro line information (checked August 2026).
// The application intentionally covers L1-L12; Ramal is outside the current product scope.
const STATION_NAMES_BY_LINE: Record<MetroLine, readonly string[]> = {
  L1: ["Pinar de Chamartín", "Bambú", "Chamartín", "Plaza de Castilla", "Valdeacederas", "Tetuán", "Estrecho", "Alvarado", "Cuatro Caminos", "Ríos Rosas", "Iglesia", "Bilbao", "Tribunal", "Gran Vía", "Sol", "Tirso de Molina", "Antón Martín", "Estación del Arte", "Atocha", "Menéndez Pelayo", "Pacífico", "Puente de Vallecas", "Nueva Numancia", "Portazgo", "Buenos Aires", "Alto del Arenal", "Miguel Hernández", "Sierra de Guadalupe", "Villa de Vallecas", "Congosto", "La Gavia", "Las Suertes", "Valdecarros"],
  L2: ["Las Rosas", "Avenida de Guadalajara", "Alsacia", "La Almudena", "La Elipa", "Ventas", "Manuel Becerra", "Goya", "Príncipe de Vergara", "Retiro", "Banco de España", "Sevilla", "Sol", "Ópera", "Santo Domingo", "Noviciado", "San Bernardo", "Quevedo", "Canal", "Cuatro Caminos"],
  L3: ["El Casar", "Villaverde Alto", "San Cristóbal", "Villaverde Bajo - Cruce", "Ciudad de los Ángeles", "San Fermín - Orcasur", "Hospital 12 de Octubre", "Almendrales", "Legazpi", "Delicias", "Palos de la Frontera", "Embajadores", "Lavapiés", "Sol", "Callao", "Plaza de España", "Ventura Rodríguez", "Argüelles", "Moncloa"],
  L4: ["Argüelles", "San Bernardo", "Bilbao", "Alonso Martínez", "Colón", "Serrano", "Velázquez", "Goya", "Lista", "Diego de León", "Avenida de América", "Prosperidad", "Alfonso XIII", "Avenida de la Paz", "Arturo Soria", "Esperanza", "Canillas", "Mar de Cristal", "San Lorenzo", "Parque de Santa María", "Hortaleza", "Manoteras", "Pinar de Chamartín"],
  L5: ["Alameda de Osuna", "El Capricho", "Canillejas", "Torre Arias", "Suanzes", "Ciudad Lineal", "Pueblo Nuevo", "Quintana", "El Carmen", "Ventas", "Diego de León", "Núñez de Balboa", "Rubén Darío", "Alonso Martínez", "Chueca", "Gran Vía", "Callao", "Ópera", "La Latina", "Puerta de Toledo", "Acacias", "Pirámides", "Marqués de Vadillo", "Urgel", "Oporto", "Vista Alegre", "Carabanchel", "Eugenia de Montijo", "Aluche", "Empalme", "Campamento", "Casa de Campo"],
  L6: ["Laguna", "Carpetana", "Oporto", "Opañel", "Plaza Elíptica", "Usera", "Legazpi", "Arganzuela - Planetario", "Méndez Álvaro", "Pacífico", "Conde de Casal", "Sainz de Baranda", "O'Donnell", "Manuel Becerra", "Diego de León", "Avenida de América", "República Argentina", "Nuevos Ministerios", "Cuatro Caminos", "Guzmán el Bueno", "Vicente Aleixandre", "Ciudad Universitaria", "Moncloa", "Argüelles", "Príncipe Pío", "Puerta del Ángel", "Alto de Extremadura", "Lucero"],
  L7: ["Hospital del Henares", "Henares", "Jarama", "San Fernando", "La Rambla", "Coslada Central", "Barrio del Puerto", "Estadio Metropolitano", "Las Musas", "San Blas", "Simancas", "García Noblejas", "Ascao", "Pueblo Nuevo", "Barrio de la Concepción", "Parque de las Avenidas", "Cartagena", "Avenida de América", "Gregorio Marañón", "Alonso Cano", "Canal", "Islas Filipinas", "Guzmán el Bueno", "Francos Rodríguez", "Valdezarza", "Antonio Machado", "Peñagrande", "Avenida de la Ilustración", "Lacoma", "Arroyofresno", "Pitis"],
  L8: ["Nuevos Ministerios", "Colombia", "Pinar del Rey", "Mar de Cristal", "Feria de Madrid", "Aeropuerto T1-T2-T3", "Barajas", "Aeropuerto T4"],
  L9: ["Paco de Lucía", "Mirasierra", "Herrera Oria", "Barrio del Pilar", "Ventilla", "Plaza de Castilla", "Duque de Pastrana", "Pío XII", "Colombia", "Concha Espina", "Cruz del Rayo", "Avenida de América", "Núñez de Balboa", "Príncipe de Vergara", "Ibiza", "Sainz de Baranda", "Estrella", "Vinateros", "Artilleros", "Pavones", "Valdebernardo", "Vicálvaro", "San Cipriano", "Puerta de Arganda", "Rivas Urbanizaciones", "Rivas Futura", "Rivas Vaciamadrid", "La Poveda", "Arganda del Rey"],
  L10: ["Hospital Infanta Sofía", "Reyes Católicos", "Baunatal", "Manuel de Falla", "Marqués de la Valdavia", "La Moraleja", "La Granja", "Ronda de la Comunicación", "Las Tablas", "Montecarmelo", "Tres Olivos", "Fuencarral", "Begoña", "Chamartín", "Plaza de Castilla", "Cuzco", "Santiago Bernabéu", "Nuevos Ministerios", "Gregorio Marañón", "Alonso Martínez", "Tribunal", "Plaza de España", "Príncipe Pío", "Lago", "Batán", "Casa de Campo", "Colonia Jardín", "Aviación Española", "Cuatro Vientos", "Joaquín Vilumbrales", "Puerta del Sur"],
  L11: ["Plaza Elíptica", "Abrantes", "Pan Bendito", "San Francisco", "Carabanchel Alto", "La Peseta", "La Fortuna"],
  L12: ["Puerta del Sur", "Parque Lisboa", "Alcorcón Central", "Parque Oeste", "Universidad Rey Juan Carlos", "Móstoles Central", "Pradillo", "Hospital de Móstoles", "Manuela Malasaña", "Loranca", "Hospital de Fuenlabrada", "Parque Europa", "Fuenlabrada Central", "Parque de los Estados", "Arroyo Culebro", "Conservatorio", "Alonso de Mendoza", "Getafe Central", "Juan de la Cierva", "El Casar", "Los Espartales", "El Bercial", "El Carrascal", "Julián Besteiro", "Casa del Reloj", "Hospital Severo Ochoa", "Leganés Central", "San Nicasio"],
};

export const METRO_STATIONS_BY_LINE = Object.fromEntries(
  Object.entries(STATION_NAMES_BY_LINE).map(([line, names]) => [
    line,
    names.map((name, sortOrder) => ({ id: stationIdFromName(name), line: line as MetroLine, name, sortOrder })),
  ]),
) as Record<MetroLine, MetroStation[]>;

export function stationIdFromName(name: string) {
  return normalizeStationSearch(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function normalizeStationSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getStationsForLine(line: MetroLine) {
  return METRO_STATIONS_BY_LINE[line];
}

export function getStationById(line: MetroLine, stationId: string | null | undefined) {
  if (!stationId) return null;
  return METRO_STATIONS_BY_LINE[line].find((station) => station.id === stationId) ?? null;
}

export function getStationName(line: MetroLine, stationId: string | null | undefined) {
  return getStationById(line, stationId)?.name ?? null;
}

export function isStationOnLine(stationId: string, line: MetroLine) {
  return getStationById(line, stationId) !== null;
}

export function searchStations(line: MetroLine, query: string, limit = 8) {
  const normalizedQuery = normalizeStationSearch(query);
  const stations = METRO_STATIONS_BY_LINE[line];
  if (!normalizedQuery) return stations.slice(0, limit);

  return stations
    .map((station) => ({ station, normalizedName: normalizeStationSearch(station.name) }))
    .filter(({ normalizedName }) => normalizedName.includes(normalizedQuery))
    .toSorted((a, b) => {
      const aStarts = a.normalizedName.startsWith(normalizedQuery);
      const bStarts = b.normalizedName.startsWith(normalizedQuery);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return a.station.sortOrder - b.station.sortOrder;
    })
    .slice(0, limit)
    .map(({ station }) => station);
}
