import { NextResponse } from "next/server";
import {
  getAvailableMonthKeys,
  getCurrentJakartaMonthKey,
  loadRowsByMonths,
} from "@/server/loadMergedRows";

function sum(nums: number[]) {
  let t = 0;
  for (const n of nums) t += Number.isFinite(n) ? n : 0;
  return t;
}

function parseMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return { y, m };
}
function monthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}
function addMonths(key: string, delta: number) {
  const { y, m } = parseMonthKey(key);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return monthKey(ny, nm);
}
function buildRange(startKey: string, endKey: string) {
  const out: string[] = [];
  let cur = startKey;
  while (cur <= endKey) {
    out.push(cur);
    cur = addMonths(cur, 1);
  }
  return out;
}
function clampToAvailable(range: string[], availableSet: Set<string>) {
  return range.filter((m) => availableSet.has(m));
}
function previousPeriod(months: string[]) {
  if (months.length === 0) return [];
  const len = months.length;
  const start = months[0];
  const prevStart = addMonths(start, -len);
  const prevEnd = addMonths(start, -1);
  return buildRange(prevStart, prevEnd);
}
function deltaPct(cur: number, prev: number) {
  if (!Number.isFinite(prev) || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}
function productiveARCountFromRows(rows: any[]) {
  const byAR = new Map<string, number>();
  for (const r of rows) {
    const key = r.kodeSales || `${r.namaAr}-${r.witel}-${r.telda}`;
    byAR.set(
      key,
      (byAR.get(key) ?? 0) + (Number.isFinite(r.sales) ? r.sales : 0)
    );
  }
  const count = Array.from(byAR.values()).filter((sales) => sales > 3).length;
  return { count, arTotal: byAR.size };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const availableMonths = await getAvailableMonthKeys();
  const availableSet = new Set(availableMonths);

  const current = getCurrentJakartaMonthKey();
  const defaultMonth = availableSet.has(current)
    ? current
    : availableMonths[availableMonths.length - 1] || "";

  const startParam = (searchParams.get("start") || "").trim();
  const endParam = (searchParams.get("end") || "").trim();

  const start = availableSet.has(startParam) ? startParam : defaultMonth;
  const end = availableSet.has(endParam) ? endParam : start;

  const startFixed = start <= end ? start : end;
  const endFixed = start <= end ? end : start;

  const selectedRaw =
    startFixed && endFixed ? buildRange(startFixed, endFixed) : [];
  const selectedMonths = clampToAvailable(selectedRaw, availableSet);

  const prevRaw = previousPeriod(selectedRaw);
  const prevMonths = clampToAvailable(prevRaw, availableSet);

  const witelParam = (searchParams.get("witel") || "").trim();
  const selectedWitel = witelParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const curAll = selectedMonths.length
    ? await loadRowsByMonths(selectedMonths)
    : [];
  const curRows = selectedWitel.length
    ? curAll.filter((r) => selectedWitel.includes(r.witel))
    : curAll;

  const prevAll = prevMonths.length ? await loadRowsByMonths(prevMonths) : [];
  const prevRows = selectedWitel.length
    ? prevAll.filter((r) => selectedWitel.includes(r.witel))
    : prevAll;

  const curSales = sum(curRows.map((r) => r.sales));
  const curPOI = sum(curRows.map((r) => r.poi));
  const curColl = sum(curRows.map((r) => r.coll));

  const prevSales = sum(prevRows.map((r) => r.sales));
  const prevPOI = sum(prevRows.map((r) => r.poi));
  const prevColl = sum(prevRows.map((r) => r.coll));

  const curProd = productiveARCountFromRows(curRows);
  const prevProd = productiveARCountFromRows(prevRows);

  const cards = [
    {
      id: "total_sales",
      title: "Total Sales",
      value: curSales,
      unit: "number",
      deltaPct: deltaPct(curSales, prevSales),
    },
    {
      id: "total_poi",
      title: "Total POI",
      value: curPOI,
      unit: "number",
      deltaPct: deltaPct(curPOI, prevPOI),
    },
    {
      id: "total_collection",
      title: "Total Collection",
      value: curColl,
      unit: "number",
      deltaPct: deltaPct(curColl, prevColl),
    },
    {
      id: "ar_productive",
      title: "AR Produktif",
      value: curProd.count,
      totalAr: curProd.arTotal, // ← tambahan
      unit: "number",
      deltaPct: deltaPct(curProd.count, prevProd.count),
    },
  ];

  return NextResponse.json({
    cards,
    lastSync: new Date().toISOString(),
    availableMonths,
    selected: { start: startFixed, end: endFixed, months: selectedMonths },
    previous: { months: prevMonths },
    rowCount: curRows.length,
    rowCountPrev: prevRows.length,
    arCount: curProd.arTotal,
    arCountPrev: prevProd.arTotal,
  });
}
