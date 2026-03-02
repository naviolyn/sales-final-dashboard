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

  const rows = defaultMonth ? await loadRowsByMonths([defaultMonth]) : [];
  const witel = uniqSorted(rows.map((r) => r.witel));

  return NextResponse.json({
    months,
    witel,
    defaultStart: defaultMonth,
    defaultEnd: defaultMonth,
    lastSync: new Date().toISOString(),
  });
}
