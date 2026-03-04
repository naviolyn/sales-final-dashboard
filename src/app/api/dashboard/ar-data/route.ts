import { NextRequest, NextResponse } from "next/server";
import { loadRowsByMonths } from "@/server/loadMergedRows";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const start = sp.get("start") ?? "";
    const end = sp.get("end") ?? "";
    const witelParam = sp.get("witel") ?? "";
    const teldaParam = sp.get("telda") ?? "";
    const kodeSalesQ = (sp.get("kodeSales") ?? "").toLowerCase();
    const sortBy = (sp.get("sortBy") ?? "sales") as
      | "namaAr"
      | "witel"
      | "telda"
      | "kodeSales"
      | "sales"
      | "poi"
      | "coll";
    const sortDir = sp.get("sortDir") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(200, parseInt(sp.get("pageSize") ?? "50", 10));

    if (!start || !end) {
      return NextResponse.json(
        { ok: false, message: "start and end required" },
        { status: 400 }
      );
    }

    function monthsBetween(s: string, e: string): string[] {
      const result: string[] = [];
      const [sy, sm] = s.split("-").map(Number);
      const [ey, em] = e.split("-").map(Number);
      let y = sy,
        m = sm;
      while (y < ey || (y === ey && m <= em)) {
        result.push(`${y}-${String(m).padStart(2, "0")}`);
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
      return result;
    }

    const months = monthsBetween(start, end);
    const rows = await loadRowsByMonths(months);

    const witelSet = witelParam
      ? new Set(witelParam.split(",").map((w) => w.trim()))
      : null;
    const teldaSet = teldaParam
      ? new Set(teldaParam.split(",").map((t) => t.trim()))
      : null;

    const map = new Map<
      string,
      {
        namaAr: string;
        witel: string;
        telda: string;
        kodeSales: string;
        sales: number;
        poi: number;
        coll: number;
      }
    >();

    for (const row of rows) {
      const key = row.kodeSales || row.namaAr || "";
      if (!key) continue;
      if (witelSet && !witelSet.has(row.witel)) continue;
      if (teldaSet && !teldaSet.has(row.telda)) continue;
      if (kodeSalesQ) {
        const kode = (row.kodeSales ?? "").toLowerCase();
        const nama = (row.namaAr ?? "").toLowerCase();
        if (!kode.includes(kodeSalesQ) && !nama.includes(kodeSalesQ)) continue;
      }

      const existing = map.get(key);
      if (existing) {
        existing.sales += Number(row.sales ?? 0);
        existing.poi += Number(row.poi ?? 0);
        existing.coll += Number(row.coll ?? 0);
      } else {
        map.set(key, {
          namaAr: row.namaAr ?? "",
          witel: row.witel ?? "",
          telda: row.telda ?? "",
          kodeSales: row.kodeSales ?? "",
          sales: Number(row.sales ?? 0),
          poi: Number(row.poi ?? 0),
          coll: Number(row.coll ?? 0),
        });
      }
    }

    let items = Array.from(map.values());
    items.sort((a, b) => {
      const av = a[sortBy],
        bv = b[sortBy];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

    const total = items.length;
    const allWitels = [
      ...new Set(rows.map((r) => r.witel).filter(Boolean)),
    ].sort();
    const teldaRows = witelSet
      ? rows.filter((r) => witelSet.has(r.witel))
      : rows;
    const allTeldas = [
      ...new Set(teldaRows.map((r) => r.telda).filter(Boolean)),
    ].sort();

    return NextResponse.json({
      ok: true,
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total,
      witels: allWitels,
      teldas: allTeldas,
    });
  } catch (err: any) {
    console.error("[ar-data]", err);
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
