import { SHEETS_BY_MONTH } from "@/config/sheets";
import { fetchSheetValues } from "@/server/googleSheets";

export type ARRow = {
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

export async function loadRowsByMonths(months: string[]): Promise<ARRow[]> {
  const tasks = months.map(async (m) => {
    const cfg = SHEETS_BY_MONTH[m];
    if (!cfg) return [];

    // ✅ rangeA1 wajib ada
    const rangeA1 = `${cfg.tabName}!${cfg.range ?? "A1:H"}`;

    // ✅ fetchSheetValues butuh { spreadsheetId, rangeA1 }
    const values = await fetchSheetValues({
      spreadsheetId: cfg.spreadsheetId,
      rangeA1,
    });

    if (values.length < 2) return [];

    // ✅ convert values[][] -> objects dengan header
    const headers = values[0].map(normHeader);
    const out: ARRow[] = [];

    for (let i = 1; i < values.length; i++) {
      const rowArr = values[i] ?? [];
      const obj: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = rowArr[j] != null ? String(rowArr[j]) : "";
      }

      out.push({
        month: m,
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
``;
