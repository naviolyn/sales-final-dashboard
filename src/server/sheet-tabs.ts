import { SPREADSHEET_ID, DEFAULT_RANGE } from "@/config/sheets";
import { fetchSpreadsheetMeta, fetchSheetValues } from "@/server/googleSheets";

/**
 * Tab title contoh: "November 2025"
 * Output key: "2025-11"
 */
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

export type MonthTab = {
  key: string; // "YYYY-MM"
  title: string; // "November 2025"
  tabName: string; // same as title
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function parseTabTitleToMonthKey(title: string): string | null {
  const t = title.trim().toLowerCase();
  // match: "<bulan> <tahun>"
  const m = t.match(/^([a-z]+)\s+(\d{4})$/i);
  if (!m) return null;
  const monthName = m[1].toLowerCase();
  const year = Number(m[2]);
  const monthNum = ID_MONTHS[monthName];
  if (!monthNum || !Number.isFinite(year)) return null;
  return `${year}-${pad2(monthNum)}`;
}

let cache: { expiresAt: number; tabs: MonthTab[] } | null = null;

export async function getMonthTabs(ttlSeconds = 300): Promise<MonthTab[]> {
  if (cache && Date.now() < cache.expiresAt) return cache.tabs;

  const meta = await fetchSpreadsheetMeta({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheets = meta.sheets ?? [];

  const tabs: MonthTab[] = [];
  for (const s of sheets) {
    const title = s.properties?.title ?? "";
    const key = parseTabTitleToMonthKey(title);
    if (!key) continue;
    tabs.push({ key, title, tabName: title });
  }

  // sort by key asc (YYYY-MM lexicographically works)
  tabs.sort((a, b) => a.key.localeCompare(b.key));

  cache = { expiresAt: Date.now() + ttlSeconds * 1000, tabs };
  return tabs;
}

export function getJakartaCurrentMonthKey(date = new Date()): string {
  // ambil YYYY-MM untuk timezone Asia/Jakarta via Intl
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

export async function fetchValuesForMonthKey(monthKey: string) {
  const tabs = await getMonthTabs();
  const tab = tabs.find((t) => t.key === monthKey);
  if (!tab) return [];
  const rangeA1 = `${tab.tabName}!${DEFAULT_RANGE}`;
  return fetchSheetValues({ spreadsheetId: SPREADSHEET_ID, rangeA1 });
}
