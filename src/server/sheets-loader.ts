// src/server/sheets-loader.ts
import { fetchSheetValues } from "@/server/googleSheets";
import {
  getAvailableMonthKeys,
  loadRowsByMonths,
} from "@/server/loadMergedRows";

export type RawARRow = {
  month: string; // "YYYY-MM"
  witel: string;
  telda: string;
  kodeSales: string;
  namaAr: string;
  sales: number;
  poi: number;
  coll: number;
};

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

/**
 * Loader cached: ambil merged rows by months (YYYY-MM).
 * NOTE: untuk parsing dan normalisasi data, kita delegasikan ke loadRowsByMonths()
 * supaya cuma 1 sumber kebenaran.
 */
export async function loadMergedRowsByMonths(
  months: string[],
  ttlSeconds = 60
) {
  const available = await getAvailableMonthKeys();

  // filter only valid months
  const safeMonths = months
    .map((m) => m.trim())
    .filter(Boolean)
    .filter((m) => available.includes(m));

  const monthsKey = safeMonths.slice().sort().join(",");
  const cacheKey = `merged:${monthsKey}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return { rows: cached, fromCache: true, cacheTtlSeconds: ttlSeconds };
  }

  const rows = safeMonths.length ? await loadRowsByMonths(safeMonths) : [];

  setCache(cacheKey, rows, ttlSeconds * 1000);

  return { rows, fromCache: false, cacheTtlSeconds: ttlSeconds };
}
