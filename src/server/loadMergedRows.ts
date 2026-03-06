import { fetchSheetValues, fetchSpreadsheetMeta } from "@/server/googleSheets";

export type ARRow = {
  month: string; // "YYYY-MM"
  witel: string;
  telda: string;
  kodeSales: string;
  namaAr: string;
  noHp: string; // ← NEW
  email: string; // ← NEW
  sales: number;
  poi: number;
  coll: number;
};

const SPREADSHEET_ID = "1YCtYBlhWhLO28o-bV09o3osfwbW7k8_P6ACqO2xONgc";
const DEFAULT_RANGE = "A1:J"; // diperluas dari H ke J untuk cover NO_HP dan EMAIL

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
  const m = title
    .trim()
    .toLowerCase()
    .match(/^([a-z]+)\s+(\d{4})$/);
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
  return (
    String(h ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      // Normalize variasi nama kolom HP/Email
      .replace(/NO[_\s]?HP[_\s]?AR?/g, "NO_HP")
      .replace(/EMAIL[_\s]?AR?/g, "EMAIL")
  );
}

function getCell(obj: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const val = (obj[key] ?? "").trim();
    if (val) return val;
  }
  return "";
}

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ===== Cache 1: tab metadata (bulan -> nama tab)
type MonthTabMap = Record<string, string>; // {"2025-11":"November 2025", ...}
let tabCache: { expiresAt: number; map: MonthTabMap; months: string[] } | null =
  null;

async function getTabMap(ttlSeconds = 300) {
  if (tabCache && Date.now() < tabCache.expiresAt) return tabCache;

  const meta = await fetchSpreadsheetMeta({ spreadsheetId: SPREADSHEET_ID });
  const sheets = meta.sheets ?? [];

  const map: MonthTabMap = {};
  for (const s of sheets) {
    const title = s.properties?.title ?? "";
    // Skip tab "Data AR" (tab master kontak) — data HP/email diambil dari situ
    if (title.trim().toLowerCase() === "data ar") continue;
    const key = parseTabToKey(title);
    if (!key) continue;
    map[key] = title;
  }

  const months = Object.keys(map).sort((a, b) => a.localeCompare(b));

  tabCache = {
    expiresAt: Date.now() + ttlSeconds * 1000,
    map,
    months,
  };
  return tabCache;
}

// ===== Cache 2: row data per bulan
const rowCache = new Map<string, { expiresAt: number; rows: ARRow[] }>();
const rowFetchPromises = new Map<string, Promise<ARRow[]>>();

// ===== Cache 3: Data AR tab (master kontak)
let contactCache: {
  expiresAt: number;
  map: Map<string, { noHp: string; email: string }>;
} | null = null;

/**
 * Load kontak dari tab "Data AR" (spreadsheet tab khusus kontak AR)
 * Key: kodeSales (KODE_BARU) — gunakan untuk join dengan data bulanan
 */
async function loadContactMap(
  ttlSeconds = 300
): Promise<Map<string, { noHp: string; email: string }>> {
  if (contactCache && Date.now() < contactCache.expiresAt) {
    return contactCache.map;
  }

  const map = new Map<string, { noHp: string; email: string }>();

  try {
    const values = await fetchSheetValues({
      spreadsheetId: SPREADSHEET_ID,
      rangeA1: "Data AR!A1:J",
    });

    if (values.length < 2) return map;

    const headers = values[0].map(normHeader);

    for (let i = 1; i < values.length; i++) {
      const rowArr = values[i] ?? [];
      const obj: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = rowArr[j] != null ? String(rowArr[j]) : "";
      }

      // Coba berbagai variasi nama kolom
      const kodeSales = getCell(
        obj,
        "KODE_BARU",
        "KODE_SALES",
        "KODE",
        "NO_KODE"
      ).trim();
      const noHp = getCell(
        obj,
        "NO_HP",
        "NO_HP_AR",
        "NOHP",
        "TELPON",
        "PHONE"
      ).trim();
      const email = getCell(obj, "EMAIL", "EMAIL_AR", "MAIL").trim();

      if (kodeSales) {
        map.set(kodeSales, { noHp, email });
      }
    }
  } catch (err) {
    console.warn("[loadMergedRows] Tab 'Data AR' tidak bisa dibaca:", err);
    // Kembalikan map kosong — data tetap load, hanya tanpa kontak
  }

  contactCache = {
    expiresAt: Date.now() + ttlSeconds * 1000,
    map,
  };
  return map;
}

async function fetchAndParseRows(
  monthKey: string,
  tabName: string
): Promise<ARRow[]> {
  // Cek cache dulu
  const cached = rowCache.get(monthKey);
  if (cached && Date.now() < cached.expiresAt) return cached.rows;

  const existing = rowFetchPromises.get(monthKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const rangeA1 = `${tabName}!${DEFAULT_RANGE}`;
      const [values, contactMap] = await Promise.all([
        fetchSheetValues({ spreadsheetId: SPREADSHEET_ID, rangeA1 }),
        loadContactMap(),
      ]);

      if (values.length < 2) return [];

      const headers = values[0].map(normHeader);
      const out: ARRow[] = [];

      for (let i = 1; i < values.length; i++) {
        const rowArr = values[i] ?? [];
        const obj: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = rowArr[j] != null ? String(rowArr[j]) : "";
        }

        const kodeSales = getCell(
          obj,
          "KODE_SALES",
          "KODE_BARU",
          "KODE"
        ).trim();

        // Coba ambil noHp/email dari kolom sheet bulanan dulu
        // Kalau tidak ada, ambil dari tab Data AR (join by kodeSales)
        let noHp = getCell(obj, "NO_HP", "NO_HP_AR", "NOHP", "TELPON").trim();
        let email = getCell(obj, "EMAIL", "EMAIL_AR", "MAIL").trim();

        if ((!noHp || !email) && kodeSales) {
          const contact = contactMap.get(kodeSales);
          if (contact) {
            if (!noHp) noHp = contact.noHp;
            if (!email) email = contact.email;
          }
        }

        out.push({
          month: monthKey,
          witel: toTitleCase(getCell(obj, "WITEL")),
          telda: getCell(obj, "TELDA"),
          kodeSales,
          namaAr: getCell(obj, "NAMA_AR", "NAMA"),
          noHp,
          email,
          sales: toNumber(obj["SALES"]),
          poi: toNumber(obj["POI"]),
          coll: toNumber(obj["COLL"]),
        });
      }

      rowCache.set(monthKey, {
        expiresAt: Date.now() + 5 * 60 * 1000,
        rows: out,
      });

      return out;
    } finally {
      rowFetchPromises.delete(monthKey);
    }
  })();

  rowFetchPromises.set(monthKey, promise);
  return promise;
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
    return fetchAndParseRows(monthKey, tabName);
  });

  const nested = await Promise.all(tasks);
  return nested.flat();
}
