// src/server/sheets-loader.ts
import { SHEETS_BY_MONTH } from "@/config/sheets";
import { fetchSheetValues } from "@/server/googleSheets";

export type RawARRow = {
  month: string;
  witel: string;
  telda: string;
  kodeSales: string;
  namaAr: string;
  sales: number;
  poi: number;
  coll: number;
};

function toNumber(v: unknown) {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  // handle "1.234" atau "1,234" → remove separator
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

// ---- Cache sederhana in-memory (cukup untuk MVP dev / single instance)
type CacheEntry<T> = { expiresAt: number; value: T };
const cache = new Map<string, CacheEntry<RawARRow[]>>();

function getCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key: string, value: RawARRow[], ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ---- loader utama
export async function loadMergedRowsByMonths(months: string[], ttlSeconds = 60) {
  const monthsKey = months.slice().sort().join(",");
  const cacheKey = `merged:${monthsKey}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return { rows: cached, fromCache: true, cacheTtlSeconds: ttlSeconds };
  }

  const tasks = months.map(async (month) => {
    const cfg = SHEETS_BY_MONTH[month];
    if (!cfg) return [];

    const range = `${cfg.tabName}!${cfg.range ?? "A1:H"}`;
    const values = await fetchSheetValues({
      spreadsheetId: cfg.spreadsheetId,
      rangeA1: range,
    });

    if (values.length < 2) return [];

    const headers = values[0].map(normHeader);
    const out: RawARRow[] = [];

    for (let i = 1; i < values.length; i++) {
      const rowArr = values[i] ?? [];
      const obj: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = rowArr[j] != null ? String(rowArr[j]) : "";
      }

      // normalisasi kolom (sesuaikan ini dengan header sheet kamu)
      // dari excel kamu: WITEL, TELDA, KODE_SALES, NAMA_AR, SALES, POI, COLL
      out.push({
        month,
        witel: getCell(obj, "WITEL"),
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
  const merged = nested.flat();

  setCache(cacheKey, merged, ttlSeconds * 1000);

  return { rows: merged, fromCache: false, cacheTtlSeconds: ttlSeconds };
}
