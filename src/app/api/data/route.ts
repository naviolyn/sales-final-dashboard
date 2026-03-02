// src/app/api/data/route.ts
import { NextResponse } from "next/server";
import { loadMergedRowsByMonths } from "@/server/sheets-loader";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const months = (searchParams.get("months") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const selectedMonths = months.length ? months : ["2026-01", "2026-02", "2026-03"];

  const { rows, fromCache, cacheTtlSeconds } = await loadMergedRowsByMonths(selectedMonths, 60);

  return NextResponse.json({
    months: selectedMonths,
    rowCount: rows.length,
    fromCache,
    cacheTtlSeconds,
    lastSync: new Date().toISOString(),
    rows,
  });
}
