import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAvailableMonthKeys,
  getCurrentJakartaMonthKey,
  loadRowsByMonths,
} from "@/server/loadMergedRows";

const QuerySchema = z.object({
  range: z.enum(["3m", "6m", "1y"]).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  witel: z.string().optional(),
  metric: z.enum(["sales", "poi", "coll"]).optional(),
});

function pickMonthsInRange(available: string[], start: string, end: string) {
  const s = available.indexOf(start);
  const e = available.indexOf(end);
  if (s === -1 || e === -1) return [];
  return available.slice(Math.min(s, e), Math.max(s, e) + 1);
}

function sum(nums: number[]) {
  let t = 0;
  for (const n of nums) t += Number.isFinite(n) ? n : 0;
  return t;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const metric = parsed.data.metric ?? "sales";
  const availableMonths = await getAvailableMonthKeys();
  const current = getCurrentJakartaMonthKey();
  const defaultMonth = availableMonths.includes(current)
    ? current
    : availableMonths[availableMonths.length - 1] || "";

  let months: string[] = [];

  if (parsed.data.range) {
    const count =
      parsed.data.range === "1y" ? 12 : parsed.data.range === "6m" ? 6 : 3;
    const currentIndex = availableMonths.indexOf(defaultMonth);
    const startIndex = Math.max(0, currentIndex - (count - 1));
    months = availableMonths.slice(startIndex, currentIndex + 1);
  } else {
    const startParam = (parsed.data.start ?? "").trim();
    const endParam = (parsed.data.end ?? "").trim();
    const start =
      startParam && availableMonths.includes(startParam)
        ? startParam
        : defaultMonth;
    const end =
      endParam && availableMonths.includes(endParam) ? endParam : start;
    months = start && end ? pickMonthsInRange(availableMonths, start, end) : [];
  }

  if (!months.length) {
    return NextResponse.json({
      ok: true,
      months: [],
      items: [],
      totalSales: 0,
      lastSync: new Date().toISOString(),
    });
  }

  const witelParam = (parsed.data.witel ?? "ALL").trim();
  const selected =
    witelParam === "ALL"
      ? []
      : witelParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

  const rows = await loadRowsByMonths(months);
  const filtered = selected.length
    ? rows.filter((r) => selected.includes(r.witel))
    : rows;

  // Agregasi per witel
  const map = new Map<string, { sales: number; poi: number; coll: number }>();
  for (const r of filtered) {
    const w = r.witel || "Unknown";
    const cur = map.get(w) ?? { sales: 0, poi: 0, coll: 0 };
    cur.sales += Number.isFinite(r.sales) ? r.sales : 0;
    cur.poi += Number.isFinite(r.poi) ? r.poi : 0;
    cur.coll += Number.isFinite(r.coll) ? r.coll : 0;
    map.set(w, cur);
  }

  // Semua witel diurutkan descending — TANPA "Lainnya"
  const items = Array.from(map.entries())
    .map(([witel, vals]) => ({ witel, ...vals }))
    .sort((a, b) => b[metric] - a[metric]);

  return NextResponse.json({
    ok: true,
    months,
    witel: witelParam,
    metric,
    totalSales: sum(filtered.map((r) => r.sales)),
    totalPoi: sum(filtered.map((r) => r.poi)),
    totalColl: sum(filtered.map((r) => r.coll)),
    items,
    lastSync: new Date().toISOString(),
  });
}
