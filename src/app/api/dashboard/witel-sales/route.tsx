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
  topN: z.coerce.number().min(1).max(20).optional(),
});

function pickMonthsInRange(available: string[], start: string, end: string) {
  const s = available.indexOf(start);
  const e = available.indexOf(end);
  if (s === -1 || e === -1) return [];
  const from = Math.min(s, e);
  const to = Math.max(s, e);
  return available.slice(from, to + 1);
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

  const availableMonths = await getAvailableMonthKeys();
  const current = getCurrentJakartaMonthKey();

  const defaultMonth = availableMonths.includes(current)
    ? current
    : availableMonths[availableMonths.length - 1] || "";

  let months: string[] = [];

  // =========================
  // PRIORITAS: RANGE
  // =========================
  if (parsed.data.range) {
    const range = parsed.data.range;
    const currentIndex = availableMonths.indexOf(defaultMonth);

    let count = 3;
    if (range === "6m") count = 6;
    if (range === "1y") count = 12;

    const startIndex = Math.max(0, currentIndex - (count - 1));
    months = availableMonths.slice(startIndex, currentIndex + 1);
  } else {
    // fallback ke start-end manual
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

  const topN = parsed.data.topN ?? 8;

  // =========================
  // FILTER WITEL
  // =========================
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

  // =========================
  // AGREGASI SALES PER WITEL
  // =========================
  const map = new Map<string, number>();

  for (const r of filtered) {
    const w = r.witel || "Unknown";
    map.set(w, (map.get(w) ?? 0) + (Number.isFinite(r.sales) ? r.sales : 0));
  }

  const itemsAll = Array.from(map.entries())
    .map(([witel, sales]) => ({ witel, sales }))
    .sort((a, b) => b.sales - a.sales);

  const top = itemsAll.slice(0, topN);
  const rest = itemsAll.slice(topN);

  const othersSales = sum(rest.map((x) => x.sales));

  const items =
    othersSales > 0 ? [...top, { witel: "Lainnya", sales: othersSales }] : top;

  return NextResponse.json({
    ok: true,
    months,
    witel: witelParam,
    totalSales: sum(filtered.map((r) => r.sales)),
    items,
    lastSync: new Date().toISOString(),
  });
}
