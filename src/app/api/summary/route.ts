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

// ===== month helpers (YYYY-MM) =====
function parseMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return { y, m };
}
function monthKey(y: number, m: number) {
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}`;
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const availableMonths = await getAvailableMonthKeys(); // ["2025-11","2025-12",...]
  const availableSet = new Set(availableMonths);

  // ===== default start/end = current month (kalau ada), else last available =====
  const current = getCurrentJakartaMonthKey();
  const defaultMonth = availableSet.has(current)
    ? current
    : availableMonths[availableMonths.length - 1] || "";

  const startParam = (searchParams.get("start") || "").trim();
  const endParam = (searchParams.get("end") || "").trim();

  // validasi start/end harus ada di available, kalau tidak fallback
  const start = availableSet.has(startParam) ? startParam : defaultMonth;
  const end = availableSet.has(endParam) ? endParam : start;

  // pastikan start <= end
  const startFixed = start <= end ? start : end;
  const endFixed = start <= end ? end : start;

  // ===== selected range months (kontigu) =====
  const selectedRangeRaw =
    startFixed && endFixed ? buildRange(startFixed, endFixed) : [];
  const selectedMonths = clampToAvailable(selectedRangeRaw, availableSet);

  // ===== previous period months (panjang sama) =====
  const prevRangeRaw = previousPeriod(selectedRangeRaw);
  const prevMonths = clampToAvailable(prevRangeRaw, availableSet);

  // ===== witel (multi, comma) =====
  const witelParam = (searchParams.get("witel") || "").trim(); // "Aceh Barat,Sumatera Utara"
  const selectedWitel = witelParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // ===== load current rows =====
  const curAll = selectedMonths.length
    ? await loadRowsByMonths(selectedMonths)
    : [];
  const curRows = selectedWitel.length
    ? curAll.filter((r) => selectedWitel.includes(r.witel))
    : curAll;

  // ===== load prev rows =====
  const prevAll = prevMonths.length ? await loadRowsByMonths(prevMonths) : [];
  const prevRows = selectedWitel.length
    ? prevAll.filter((r) => selectedWitel.includes(r.witel))
    : prevAll;

  // ===== totals current =====
  const curSales = sum(curRows.map((r) => r.sales));
  const curPOI = sum(curRows.map((r) => r.poi));
  const curColl = sum(curRows.map((r) => r.coll));

  // ===== totals prev =====
  const prevSales = sum(prevRows.map((r) => r.sales));
  const prevPOI = sum(prevRows.map((r) => r.poi));
  const prevColl = sum(prevRows.map((r) => r.coll));

  // ===== AR Produktif current (sales > 3 pada selected period) =====
  const byAR = new Map<string, { sales: number }>();
  for (const r of curRows) {
    const key = r.kodeSales || `${r.namaAr}-${r.witel}-${r.telda}`;
    const cur = byAR.get(key) ?? { sales: 0 };
    cur.sales += r.sales;
    byAR.set(key, cur);
  }
  const productiveARCount = Array.from(byAR.values()).filter(
    (x) => x.sales > 3
  ).length;

  const cards = [
    {
      id: "total_sales",
      title: "Total Sales",
      value: curSales,
      unit: "number",
      deltaPct: deltaPct(curSales, prevSales),
      subtitle: `Periode: ${selectedMonths.join(", ")}`,
    },
    {
      id: "total_poi",
      title: "Total POI",
      value: curPOI,
      unit: "number",
      deltaPct: deltaPct(curPOI, prevPOI),
      subtitle: `Periode: ${selectedMonths.join(", ")}`,
    },
    {
      id: "total_collection",
      title: "Total Collection",
      value: curColl,
      unit: "number",
      deltaPct: deltaPct(curColl, prevColl),
      subtitle: `Periode: ${selectedMonths.join(", ")}`,
    },
    {
      id: "ar_productive",
      title: "AR Produktif",
      value: productiveARCount,
      unit: "number",
      // delta produktif bisa kamu tambahin nanti kalau mau (perlu hitung produktif prev period juga)
      deltaPct: null,
      subtitle: `Sales > 3 pada periode terpilih`,
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
    arCount: byAR.size,
  });
}
