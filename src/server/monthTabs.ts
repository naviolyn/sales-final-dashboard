import { fetchSpreadsheetMeta } from "@/server/googleSheets";
import { SPREADSHEET_ID } from "@/config/sheets";

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

export function parseTabToKey(title: string): string | null {
  const match = title
    .trim()
    .toLowerCase()
    .match(/^([a-z]+)\s+(\d{4})$/);
  if (!match) return null;

  const monthName = match[1];
  const year = Number(match[2]);
  const monthNum = ID_MONTHS[monthName];

  if (!monthNum) return null;

  return `${year}-${pad2(monthNum)}`;
}

export async function getAvailableMonths() {
  const meta = await fetchSpreadsheetMeta({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheets = meta.sheets ?? [];

  const months: string[] = [];

  for (const s of sheets) {
    const title = s.properties?.title ?? "";
    const key = parseTabToKey(title);
    if (key) months.push(key);
  }

  // urutkan ascending (YYYY-MM aman lexicographically)
  months.sort((a, b) => a.localeCompare(b));

  return months;
}

export function getCurrentJakartaMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";

  return `${y}-${m}`;
}
