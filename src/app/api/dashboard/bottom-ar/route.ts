import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAvailableMonthKeys,
  getCurrentJakartaMonthKey,
  loadRowsByMonths,
} from "@/server/loadMergedRows";

const QuerySchema = z.object({
  month: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  witel: z.string().optional(),
  bottomN: z.coerce.number().min(1).max(50).optional(),
  metric: z.enum(["sales", "poi", "coll"]).optional(),
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

  const witelParam = (parsed.data.witel ?? "ALL").trim();
  const bottomN = parsed.data.bottomN ?? 5;
  const metric = parsed.data.metric ?? "sales";

  // Parse multi-witel (comma-separated)
  const selectedWitels =
    witelParam === "ALL"
      ? []
      : witelParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

  // Resolve months
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
      witel: witelParam,
      items: [],
      lastSync: new Date().toISOString(),
    });
  }

  const rows = await loadRowsByMonths(months);

  // Filter witel — support single dan multi
  const filtered =
    selectedWitels.length > 0
      ? rows.filter((r) => selectedWitels.includes(r.witel))
      : rows;

  // Agregasi per AR
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

  // Sort ascending berdasarkan metric yang dipilih, ambil bottom N
  const all = Array.from(arMap.values());
  const items = all.sort((a, b) => a[metric] - b[metric]).slice(0, bottomN);

  return NextResponse.json({
    ok: true,
    months,
    witel: witelParam,
    metric,
    bottomN,
    totalSales: sum(filtered.map((r) => r.sales)),
    totalPoi: sum(filtered.map((r) => r.poi)),
    totalColl: sum(filtered.map((r) => r.coll)),
    items,
    lastSync: new Date().toISOString(),
  });
}
