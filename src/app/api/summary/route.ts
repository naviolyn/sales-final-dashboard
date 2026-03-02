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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const availableMonths = await getAvailableMonthKeys();

  // ===== months (multi) =====
  const monthsParam = (searchParams.get("months") || "").trim();
  const requestedMonths = monthsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((m) => availableMonths.includes(m));

  // default: bulan saat ini (Asia/Jakarta) kalau ada, else bulan terakhir tersedia
  const current = getCurrentJakartaMonthKey();
  const defaultMonth = availableMonths.includes(current)
    ? current
    : availableMonths[availableMonths.length - 1] || "";

  const selectedMonths = requestedMonths.length
    ? requestedMonths
    : defaultMonth
    ? [defaultMonth]
    : [];

  // ===== witel (multi) =====
  const witelParam = (searchParams.get("witel") || "").trim();
  const selectedWitel = witelParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // ===== load rows untuk KPI totals (akumulasi selected months) =====
  const rowsAll = selectedMonths.length
    ? await loadRowsByMonths(selectedMonths)
    : [];
  const rows = selectedWitel.length
    ? rowsAll.filter((r) => selectedWitel.includes(r.witel))
    : rowsAll;

  const totalSales = sum(rows.map((r) => r.sales));
  const totalPOI = sum(rows.map((r) => r.poi));
  const totalColl = sum(rows.map((r) => r.coll));

  // ✅ AR Produktif: sales > 3 pada periode terpilih (selectedMonths)
  const byAR = new Map<string, { sales: number }>();
  for (const r of rows) {
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
      value: totalSales,
      unit: "number",
      subtitle: `Akumulasi bulan: ${selectedMonths.join(", ")}`,
    },
    {
      id: "total_poi",
      title: "Total POI",
      value: totalPOI,
      unit: "number",
      subtitle: `Akumulasi bulan: ${selectedMonths.join(", ")}`,
    },
    {
      id: "total_collection",
      title: "Total Collection",
      value: totalColl,
      unit: "number",
      subtitle: `Akumulasi bulan: ${selectedMonths.join(", ")}`,
    },
    {
      id: "ar_productive",
      title: "AR Produktif",
      value: productiveARCount,
      unit: "number",
      subtitle: `Sales > 3 pada periode: ${selectedMonths.join(", ")}`,
    },
  ];

  return NextResponse.json({
    cards,
    lastSync: new Date().toISOString(),

    // buat dropdown/filter
    months: availableMonths,
    selectedMonths,

    rowCount: rows.length,
    arCount: byAR.size,
  });
}
