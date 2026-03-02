import { NextResponse } from "next/server";
import {
  getAvailableMonthKeys,
  getCurrentJakartaMonthKey,
  loadRowsByMonths,
} from "@/server/loadMergedRows";

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export async function GET() {
  const months = await getAvailableMonthKeys();

  const current = getCurrentJakartaMonthKey();
  const defaultMonth = months.includes(current)
    ? current
    : months[months.length - 1] || "";

  // ambil witel dari default month biar cepat & relevan
  const rows = defaultMonth ? await loadRowsByMonths([defaultMonth]) : [];
  const witel = uniqSorted(rows.map((r) => r.witel));

  return NextResponse.json({
    months, // ["2025-11","2025-12","2026-01",...]
    witel, // ["Aceh", "Aceh Barat", ...] (udah title case dari loader)
    defaultMonth, // bulan sekarang kalau ada, else last
    lastSync: new Date().toISOString(),
  });
}
