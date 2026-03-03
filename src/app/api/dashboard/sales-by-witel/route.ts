import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAvailableMonthKeys,
  getCurrentJakartaMonthKey,
  loadRowsByMonths,
} from "@/server/loadMergedRows";

const QuerySchema = z.object({
  range: z.enum(["3m", "6m", "1y"]).optional(), // default 3m
  witel: z.string().optional(), // optional, kalau mau 1 witel doang
  top: z.coerce.number().min(1).max(20).optional(), // top witels saat ALL
});

function sum(nums: number[]) {
  let t = 0;
  for (const n of nums) t += Number.isFinite(n) ? n : 0;
  return t;
}

function pickMonths(available: string[], n: number) {
  if (!available.length) return [];

  const current = getCurrentJakartaMonthKey();
  const endIdx = available.includes(current)
    ? available.indexOf(current)
    : available.length - 1;

  const startIdx = Math.max(0, endIdx - (n - 1));
  return available.slice(startIdx, endIdx + 1);
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

  const range = parsed.data.range ?? "3m";
  const top = parsed.data.top ?? 5;
  const witelParam = (parsed.data.witel ?? "ALL").trim();

  const available = await getAvailableMonthKeys(); // ["2025-11","2025-12",...]
  const n = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const months = pickMonths(available, n);

  if (!months.length) {
    return NextResponse.json({
      ok: true,
      months: [],
      series: [],
      data: [],
      lastSync: new Date().toISOString(),
    });
  }

  const rows = await loadRowsByMonths(months);

  // ===== mode 1: single witel (kalau dipassing)
  if (witelParam !== "ALL") {
    const filtered = rows.filter((r) => r.witel === witelParam);

    const byMonth = new Map<string, number>();
    for (const r of filtered) {
      byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + r.sales);
    }

    const data = months.map((m) => ({
      month: m,
      s0: byMonth.get(m) ?? 0,
    }));

    return NextResponse.json({
      ok: true,
      mode: "single",
      range,
      months,
      series: [{ key: "s0", label: witelParam }],
      data,
      lastSync: new Date().toISOString(),
    });
  }

  // ===== mode 2: ALL → stacked area top N witel + Others
  // total sales per witel (untuk ranking top)
  const totalByWitel = new Map<string, number>();
  const byMonthWitel = new Map<string, Map<string, number>>();

  for (const r of rows) {
    // total by witel
    totalByWitel.set(r.witel, (totalByWitel.get(r.witel) ?? 0) + r.sales);

    // month -> witel -> sales
    const mm = byMonthWitel.get(r.month) ?? new Map<string, number>();
    mm.set(r.witel, (mm.get(r.witel) ?? 0) + r.sales);
    byMonthWitel.set(r.month, mm);
  }

  const topWitels = Array.from(totalByWitel.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([w]) => w);

  // series keys aman (tanpa spasi) → s0,s1,... + others
  const series = topWitels.map((label, i) => ({ key: `s${i}`, label }));
  const includeOthers = totalByWitel.size > topWitels.length;
  if (includeOthers) series.push({ key: `others`, label: "Others" });

  const data = months.map((m) => {
    const mm = byMonthWitel.get(m) ?? new Map<string, number>();
    const point: Record<string, any> = { month: m };

    // isi top series
    topWitels.forEach((w, i) => {
      point[`s${i}`] = mm.get(w) ?? 0;
    });

    // others = total bulan - sum top
    if (includeOthers) {
      const totalMonth = sum(Array.from(mm.values()));
      const topSum = sum(topWitels.map((w, i) => point[`s${i}`] as number));
      point.others = Math.max(0, totalMonth - topSum);
    }

    return point;
  });

  return NextResponse.json({
    ok: true,
    mode: "stacked",
    range,
    months,
    series,
    data,
    lastSync: new Date().toISOString(),
  });
}
