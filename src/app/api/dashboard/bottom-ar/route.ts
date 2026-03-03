import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAvailableMonthKeys,
  getCurrentJakartaMonthKey,
  loadRowsByMonths,
} from "@/server/loadMergedRows";

const QuerySchema = z.object({
  // support 2 mode filter dashboard:
  month: z.string().optional(), // single
  start: z.string().optional(), // range
  end: z.string().optional(), // range

  witel: z.string().optional(), // "ALL" atau nama witel
  bottomN: z.coerce.number().min(1).max(50).optional(),
});

function sum(nums: number[]) {
  let t = 0;
  for (const n of nums) t += Number.isFinite(n) ? n : 0;
  return t;
}

function pickMonthsInRange(available: string[], start: string, end: string) {
  const s = available.indexOf(start);
  const e = available.indexOf(end);
  if (s === -1 || e === -1) return [];
  const from = Math.min(s, e);
  const to = Math.max(s, e);
  return available.slice(from, to + 1);
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

  const witel = (parsed.data.witel ?? "ALL").trim();
  const bottomN = parsed.data.bottomN ?? 5;

  // resolve months
  let months: string[] = [];
  if (parsed.data.month) months = [parsed.data.month];
  else if (parsed.data.start && parsed.data.end)
    months = pickMonthsInRange(
      availableMonths,
      parsed.data.start,
      parsed.data.end
    );
  else months = defaultMonth ? [defaultMonth] : [];

  if (!months.length) {
    return NextResponse.json({
      ok: true,
      months: [],
      witel,
      items: [],
      lastSync: new Date().toISOString(),
    });
  }

  const rows = await loadRowsByMonths(months);
  const filtered =
    witel === "ALL" ? rows : rows.filter((r) => r.witel === witel);

  // agregasi per AR
  const arMap = new Map<string, any>();
  for (const r of filtered) {
    const key = r.kodeSales || `${r.namaAr}|${r.witel}|${r.telda}`;
    const cur = arMap.get(key) ?? {
      kodeSales: r.kodeSales,
      namaAr: r.namaAr,
      witel: r.witel,
      sales: 0,
      poi: 0,
      coll: 0,
    };
    cur.sales += r.sales;
    cur.poi += r.poi;
    cur.coll += r.coll;
    arMap.set(key, cur);
  }

  // bottom N: sort ASC sales
  const all = Array.from(arMap.values());

  // optional: kalau kamu mau exclude AR yang sales=0? (nggak aku exclude)
  const items = all.sort((a, b) => a.sales - b.sales).slice(0, bottomN);

  return NextResponse.json({
    ok: true,
    months,
    witel,
    bottomN,
    totalSales: sum(filtered.map((r) => r.sales)),
    items,
    lastSync: new Date().toISOString(),
  });
}
