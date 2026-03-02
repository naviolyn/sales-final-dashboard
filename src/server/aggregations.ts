// src/server/aggregations.ts
import type { RawARRow } from "@/server/sheets-loader";

export type ARAggregate = {
  kodeSales: string;
  namaAr: string;
  witel: string;
  telda: string;
  sales_3m: number;
  poi_3m: number;
  coll_3m: number;
  byMonth?: Record<string, { sales: number; poi: number; coll: number }>;
};

export function aggregateByAR(rows: RawARRow[], keepBreakdown = true) {
  const map = new Map<string, ARAggregate>();

  for (const r of rows) {
    const key = r.kodeSales || `${r.namaAr}|${r.witel}|${r.telda}`;
    let agg = map.get(key);

    if (!agg) {
      agg = {
        kodeSales: r.kodeSales,
        namaAr: r.namaAr,
        witel: r.witel,
        telda: r.telda,
        sales_3m: 0,
        poi_3m: 0,
        coll_3m: 0,
        byMonth: keepBreakdown ? {} : undefined,
      };
      map.set(key, agg);
    }

    agg.sales_3m += r.sales;
    agg.poi_3m += r.poi;
    agg.coll_3m += r.coll;

    if (keepBreakdown) {
      agg.byMonth![r.month] ??= { sales: 0, poi: 0, coll: 0 };
      agg.byMonth![r.month].sales += r.sales;
      agg.byMonth![r.month].poi += r.poi;
      agg.byMonth![r.month].coll += r.coll;
    }
  }

  return Array.from(map.values());
}

export function productivitySplitByWitel(arAgg: ARAggregate[]) {
  // produktif jika sales_3m > 3
  const out = new Map<string, { produktif: number; nonProduktif: number }>();

  for (const ar of arAgg) {
    const w = ar.witel || "UNKNOWN";
    const bucket = out.get(w) ?? { produktif: 0, nonProduktif: 0 };

    if (ar.sales_3m <= 3) bucket.nonProduktif += 1;
    else bucket.produktif += 1;

    out.set(w, bucket);
  }

  return Array.from(out.entries()).map(([witel, v]) => ({ witel, ...v }));
}
