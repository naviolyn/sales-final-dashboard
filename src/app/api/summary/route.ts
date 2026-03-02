import { NextResponse } from "next/server";
import { loadRowsByMonths } from "@/server/loadMergedRows";

function sum(nums: number[]) {
  let t = 0;
  for (const n of nums) t += Number.isFinite(n) ? n : 0;
  return t;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthsParam = searchParams.get("months") || "";
  const months = monthsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // fallback kalau kosong
  const selectedMonths = months.length ? months : ["2026-01", "2026-02", "2026-03"];

  const rows = await loadRowsByMonths(selectedMonths);

  const totalSales = sum(rows.map((r) => r.sales));
  const totalPOI = sum(rows.map((r) => r.poi));
  const totalColl = sum(rows.map((r) => r.coll));

  // agregasi per AR across months: key = kodeSales
  const byAR = new Map<string, { sales: number }>();
  for (const r of rows) {
    const key = r.kodeSales || `${r.namaAr}-${r.witel}-${r.telda}`;
    const cur = byAR.get(key) ?? { sales: 0 };
    cur.sales += r.sales;
    byAR.set(key, cur);
  }

  const nonProdCount = Array.from(byAR.values()).filter((x) => x.sales >= 0 && x.sales <= 3).length;

  const cards = [
    {
      id: "sales",
      title: "Total Sales (3 bulan)",
      value: totalSales,
      unit: "number",
      // deltaPct nanti dihitung beneran kalau kamu juga load 3 bulan sebelumnya
      deltaPct: 0,
      subtitle: "Akumulasi semua AR (filter aktif)",
    },
    {
      id: "poi",
      title: "Total POI",
      value: totalPOI,
      unit: "number",
      deltaPct: 0,
      subtitle: "Total visiting pelanggan",
    },
    {
      id: "coll",
      title: "Total Collection",
      value: totalColl,
      unit: "currency",
      deltaPct: 0,
      subtitle: "Total collection (IDR)",
    },
    {
      id: "prod",
      title: "AR Non-produktif",
      value: nonProdCount,
      unit: "number",
      deltaPct: 0,
      subtitle: "Sales 0–3 (total 3 bulan)",
    },
  ];

  return NextResponse.json({
    cards,
    lastSync: new Date().toISOString(),
    months: selectedMonths,
    rowCount: rows.length,
    arCount: byAR.size,
  });
}
