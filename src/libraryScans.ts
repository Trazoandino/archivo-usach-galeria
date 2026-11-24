/**
 * Maquetas reales de la Escuela escaneadas en Scaniverse (cuenta @ArqUSACHVirtuak).
 *
 * Todo se sirve desde /public/biblioteca/escaneos: las vistas de las tarjetas y, en 3d/, la copia
 * del escaneo que dibuja nuestro visor (para poder moverlo con las flechas). Para sumar una
 * maqueta: agregarla aquí, descargar https://scaniverse.com/api/media/<id>/gaussians.spz a 3d/
 * (o mesh.drc y tex.jpg si es una malla) y capturar sus vistas.
 */
/** Encargo de taller: varios estudiantes pueden haber escaneado su propia maqueta del mismo. */
export interface LibraryScanProject { name: string; place: string; teachers: readonly string[]; }

export interface LibraryScan {
  id: string; title: string; author: string;
  /** Vistas en /biblioteca/escaneos/<id>-<n>.webp, n = 1…angles. */
  angles: number;
  /** "splat" (gaussians.spz, lo habitual) o "mesh" (malla Draco .drc con su textura .jpg). */
  model?: "splat" | "mesh";
  project?: LibraryScanProject;
}

/** Polideportivo en San Antonio: varias maquetas son el mismo encargo, de estudiantes distintos. */
const POLIDEPORTIVO_SAN_ANTONIO: LibraryScanProject = {
  name: "Polideportivo",
  place: "San Antonio, Chile",
  teachers: ["Andrea Gonzalez", "Ricardo Martinez", "Ayami Nakamura", "Pablo Montecinos"],
};

/*
 * Las vistas son capturas 4:3 del propio visor de Scaniverse desde cámaras distintas (la 1 es la
 * vista previa oficial). Para sumar un ángulo: capturar el visor, recortar sin la marca superior,
 * guardarlo como <id>-<n>.webp y subir `angles`.
 */
export const LIBRARY_SCANS: readonly LibraryScan[] = [
  { id: "h5wzvilxwa5itqlc", title: "Universidad de Santiago de Chile", author: "@ArqUSACHVirtuak", angles: 4, project: POLIDEPORTIVO_SAN_ANTONIO },
  { id: "serb4xxwzrtvt6lu", title: "Universidad de Santiago de Chile", author: "@ArqUSACHVirtuak", angles: 3 },
  { id: "pusysnw5nqilomx2", title: "Pila de Ganzo", author: "@ArqUSACHVirtuak", angles: 3 },
  { id: "gpzyc5z7jwfcuzsj", title: "Maqueta taller 3", author: "@ArqUSACHVirtuak", angles: 3, model: "mesh", project: POLIDEPORTIVO_SAN_ANTONIO },
  { id: "4tnwb7lm6skcxldi", title: "24-TADA-García", author: "@ArqUSACHVirtuak", angles: 3 },
  { id: "jzzlnisdth6v2atn", title: "24-TADA-Abarza", author: "@gston", angles: 4 },
  { id: "oarz4im7ixqwr5jm", title: "24-TAD2-Berland", author: "@ArqUSACHVirtuak", angles: 3 },
];

/**
 * Los títulos de la Escuela siguen el código <año>-<taller>-<apellido>, por ejemplo
 * "24-TADA-García": TADA es Taller de Diseño Arquitectónico I y TAD2, el II.
 */
const SCAN_COURSES: Record<string, string> = {
  TADA: "Taller de Diseño Arquitectónico I",
  TAD2: "Taller de Diseño Arquitectónico II",
};
export interface LibraryScanRecord { author?: string; course?: string; year?: number; project?: LibraryScanProject; }
/** Lo que se sabe de la maqueta: el código del título y el encargo, si se conoce. Null si nada. */
export function scanRecord(scan: LibraryScan): LibraryScanRecord | null {
  const match = /^(\d{2})-([A-Z0-9]+)-(.+)$/.exec(scan.title);
  const course = match ? SCAN_COURSES[match[2]] : undefined;
  const coded = match && course ? { year: 2000 + Number(match[1]), course, author: match[3].trim() } : {};
  return course || scan.project ? { ...coded, project: scan.project } : null;
}
/** Nombre legible: "García · Taller de Diseño Arquitectónico I · 2024", "Polideportivo · San Antonio, Chile" o el título. */
export function scanLabel(scan: LibraryScan): string {
  const record = scanRecord(scan);
  if (!record) return scan.title;
  return [record.author, record.project?.name, record.course, record.project?.place, record.year].filter(Boolean).join(" · ");
}

export const scanView = (scan: LibraryScan, angle: number) => `${import.meta.env.BASE_URL}biblioteca/escaneos/${scan.id}-${angle % scan.angles + 1}.webp`;
export const scanPage = (scan: LibraryScan) => `https://scaniverse.com/scan/${scan.id}`;
export const scanEmbed = (scan: LibraryScan) => `${scanPage(scan)}?embed=1`;
/** Copias locales del escaneo (descargadas de Scaniverse) para el visor propio con flechas. */
export const scanModelUrl = (scan: LibraryScan) => `${import.meta.env.BASE_URL}biblioteca/escaneos/3d/${scan.id}.${scan.model === "mesh" ? "drc" : "spz"}`;
export const scanTextureUrl = (scan: LibraryScan) => `${import.meta.env.BASE_URL}biblioteca/escaneos/3d/${scan.id}.jpg`;


