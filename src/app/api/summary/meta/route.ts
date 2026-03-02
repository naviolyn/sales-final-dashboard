import { NextResponse } from "next/server";
import { SHEETS_BY_MONTH } from "@/config/sheets";
import { loadRowsByMonths } from "@/server/loadMergedRows";

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export async function GET() {
  const months = Object.keys(SHEETS_BY_MONTH);

  // ambil witel dari bulan terakhir biar cepat & relevan
  const lastMonth = months[months.length - 1] || "";
  const rows = lastMonth ? await loadRowsByMonths([lastMonth]) : [];

  const witel = uniqSorted(rows.map((r) => r.witel));

  return NextResponse.json({
    months,
    witel,
    defaultMonth: lastMonth,
    lastSync: new Date().toISOString(),
  });
}
