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
  metric: z.enum(["sales", "poi", "coll"]).optional(),
});

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
  const metric = parsed.data.metric || "sales";
  const witel = (parsed.data.witel ?? "ALL").trim();

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
      produktif: 0,
      nonProduktif: 0,
      lastSync: new Date().toISOString(),
    });
  }

  const rows = await loadRowsByMonths(months);
  const filtered =
    witel === "ALL" ? rows : rows.filter((r) => r.witel === witel);

  const arMap = new Map<string, number>();
  for (const r of filtered) {
    const key = r.kodeSales || `${r.namaAr}|${r.witel}|${r.telda}`;
    arMap.set(key, (arMap.get(key) ?? 0) + r[metric]);
  }

  let produktif = 0;
  let nonProduktif = 0;
  for (const value of arMap.values()) {
    if (value > 3) produktif++;
    else nonProduktif++;
  }

  return NextResponse.json({
    ok: true,
    months,
    witel,
    metric,
    produktif,
    nonProduktif,
    total: produktif + nonProduktif,
    lastSync: new Date().toISOString(),
  });
}
