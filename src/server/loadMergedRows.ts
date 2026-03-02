import { fetchSheetValues, fetchSpreadsheetMeta } from "@/server/googleSheets";

export type ARRow = {
  month: string; // "YYYY-MM"
  witel: string;
  telda: string;
  kodeSales: string;
  namaAr: string;
  sales: number;
  poi: number;
  coll: number;
};

const SPREADSHEET_ID = "1YCtYBlhWhLO28o-bV09o3osfwbW7k8_P6ACqO2xONgc";
const DEFAULT_RANGE = "A1:H";

const ID_MONTHS: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** "November 2025" -> "2025-11" */
function parseTabToKey(title: string): string | null {
  const m = title.trim().toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const monthName = m[1];
  const year = Number(m[2]);
  const monthNum = ID_MONTHS[monthName];
  if (!monthNum || !Number.isFinite(year)) return null;
  return `${year}-${pad2(monthNum)}`;
}

function toNumber(v: unknown) {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const cleaned = s.replace(/\./g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normHeader(h: unknown) {
  return String(h ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function getCell(obj: Record<string, string>, key: string) {
  return (obj[key] ?? "").trim();
}

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ===== cache meta tab => monthKey -> tabTitle
type MonthTabMap = Record<string, string>; // {"2025-11":"November 2025", ...}
let tabCache: { expiresAt: number; map: MonthTabMap; months: string[] } | null = null;

async function getTabMap(ttlSeconds = 300) {
  if (tabCache && Date.now() < tabCache.expiresAt) return tabCache;

  const meta = await fetchSpreadsheetMeta({ spreadsheetId: SPREADSHEET_ID });
  const sheets = meta.sheets ?? [];

  const map: MonthTabMap = {};
  for (const s of sheets) {
    const title = s.properties?.title ?? "";
    const key = parseTabToKey(title);
    if (!key) continue;
    map[key] = title; // tabName asli
  }

  const months = Object.keys(map).sort((a, b) => a.localeCompare(b));

  tabCache = {
    expiresAt: Date.now() + ttlSeconds * 1000,
    map,
    months,
  };
  return tabCache;
}

/** helper default bulan sekarang (Asia/Jakarta) -> "YYYY-MM" */
export function getCurrentJakartaMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

/** buat meta dropdown: months available (YYYY-MM) */
export async function getAvailableMonthKeys() {
  const { months } = await getTabMap();
  return months;
}

/** loader utama: ambil rows dari month keys (YYYY-MM) */
export async function loadRowsByMonths(months: string[]): Promise<ARRow[]> {
  const { map } = await getTabMap();

  const tasks = months.map(async (monthKey) => {
    const tabName = map[monthKey];
    if (!tabName) return [];

    const rangeA1 = `${tabName}!${DEFAULT_RANGE}`;
    const values = await fetchSheetValues({
      spreadsheetId: SPREADSHEET_ID,
      rangeA1,
    });

    if (values.length < 2) return [];

    const headers = values[0].map(normHeader);
    const out: ARRow[] = [];

    for (let i = 1; i < values.length; i++) {
      const rowArr = values[i] ?? [];
      const obj: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = rowArr[j] != null ? String(rowArr[j]) : "";
      }

      out.push({
        month: monthKey,
        witel: toTitleCase(getCell(obj, "WITEL")),
        telda: getCell(obj, "TELDA"),
        kodeSales: getCell(obj, "KODE_SALES"),
        namaAr: getCell(obj, "NAMA_AR"),
        sales: toNumber(obj["SALES"]),
        poi: toNumber(obj["POI"]),
        coll: toNumber(obj["COLL"]),
      });
    }

    return out;
  });

  const nested = await Promise.all(tasks);
  return nested.flat();
}