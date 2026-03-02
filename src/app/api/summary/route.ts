import { NextResponse } from "next/server";
import { loadRowsByMonths } from "@/server/loadMergedRows";
import { SHEETS_BY_MONTH } from "@/config/sheets";

function sum(nums: number[]) {
  let t = 0;
  for (const n of nums) t += Number.isFinite(n) ? n : 0;
  return t;
}

function getAvailableMonths() {
  // pakai urutan dari config (sesuai yang kamu define di SHEETS_BY_MONTH)
  return Object.keys(SHEETS_BY_MONTH);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ✅ bulan = nama sheet: "November", "Desember", dst
  const availableMonths = getAvailableMonths();
  const monthParam = (searchParams.get("month") || "").trim();

  const month =
    monthParam && availableMonths.includes(monthParam)
      ? monthParam
      : availableMonths[availableMonths.length - 1] || "";

  // ✅ witel multi: "ACEH,SUMUT" atau kosong => ALL
  const witelParam = (searchParams.get("witel") || "").trim(); // bisa "ACEH" / "ACEH,SUMUT"
  const selectedwitel = witelParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // load 1 bulan aja (default 1 bulan)
  const rowsAll = month ? await loadRowsByMonths([month]) : [];

  // filter witel kalau user pilih
  const rows =
    selectedwitel.length > 0
      ? rowsAll.filter((r) => selectedwitel.includes(r.witel))
      : rowsAll;

  const totalSales = sum(rows.map((r) => r.sales));
  const totalPOI = sum(rows.map((r) => r.poi));
  const totalColl = sum(rows.map((r) => r.coll));

  const cards = [
    {
      id: "total_sales",
      title: "Total Sales",
      value: totalSales,
      unit: "number",
      subtitle: "Akumulasi semua AR (filter aktif)",
    },
    {
      id: "total_poi",
      title: "Total POI",
      value: totalPOI,
      unit: "number",
      subtitle: "Total visiting pelanggan",
    },
    {
      id: "total_collection",
      title: "Total Collection",
      value: totalColl,
      unit: "number",
      subtitle: "Total collection (angka)",
    },
  ];

  return NextResponse.json({
    cards,
    lastSync: new Date().toISOString(),
    months: availableMonths, // buat dropdown bulan
    selectedMonth: month, // optional tapi enak buat debug
    rowCount: rows.length,
  });
}
