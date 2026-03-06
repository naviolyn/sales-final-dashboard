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
      | "noHp"
      | "email"
      | "sales"
      | "poi"
      | "coll"
      | "underperform";
    const sortDir = sp.get("sortDir") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(200, parseInt(sp.get("pageSize") ?? "50", 10));
    const underperformFilter = sp.get("underperform") ?? "all"; // "all" | "underperform" | "ok"

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

    // Ambil 3 bulan terakhir untuk kalkulasi underperform (independent dari filter periode)
    // Underperform: total sales < 3 dalam 3 bulan terakhir yang ada di spreadsheet
    const rows = await loadRowsByMonths(months);

    const witelSet = witelParam
      ? new Set(witelParam.split(",").map((w) => w.trim()))
      : null;
    const teldaSet = teldaParam
      ? new Set(teldaParam.split(",").map((t) => t.trim()))
      : null;

    // Untuk underperform, kita perlu data periode yang dipilih
    // Kriteria: total sales < 3 dalam periode yang dipilih
    // Jika periode >= 3 bulan, threshold = 3; jika < 3 bulan, threshold proporsional
    const monthCount = months.length;
    // Threshold underperform: minimal 3 sales dalam periode,
    // jika periode < 3 bulan, gunakan threshold = monthCount (1 per bulan)
    const underperformThreshold = Math.min(3, monthCount);

    const map = new Map<
      string,
      {
        namaAr: string;
        witel: string;
        telda: string;
        kodeSales: string;
        noHp: string;
        email: string;
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
        // Update noHp & email jika belum terisi
        if (!existing.noHp && (row as any).noHp)
          existing.noHp = (row as any).noHp;
        if (!existing.email && (row as any).email)
          existing.email = (row as any).email;
      } else {
        map.set(key, {
          namaAr: row.namaAr ?? "",
          witel: row.witel ?? "",
          telda: row.telda ?? "",
          kodeSales: row.kodeSales ?? "",
          noHp: (row as any).noHp ?? "",
          email: (row as any).email ?? "",
          sales: Number(row.sales ?? 0),
          poi: Number(row.poi ?? 0),
          coll: Number(row.coll ?? 0),
        });
      }
    }

    // Tambahkan kolom underperform
    type ItemWithUnderperform = {
      namaAr: string;
      witel: string;
      telda: string;
      kodeSales: string;
      noHp: string;
      email: string;
      sales: number;
      poi: number;
      coll: number;
      underperform: boolean;
    };

    let items: ItemWithUnderperform[] = Array.from(map.values()).map(
      (item) => ({
        ...item,
        underperform: item.sales < underperformThreshold,
      })
    );

    // Filter underperform
    if (underperformFilter === "underperform") {
      items = items.filter((i) => i.underperform);
    } else if (underperformFilter === "ok") {
      items = items.filter((i) => !i.underperform);
    }

    // Sort
    items.sort((a, b) => {
      let av: any, bv: any;
      if (sortBy === "underperform") {
        av = a.underperform ? 1 : 0;
        bv = b.underperform ? 1 : 0;
      } else {
        av = (a as any)[sortBy];
        bv = (b as any)[sortBy];
      }
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });

    const total = items.length;

    // Telda stats — jumlah AR unik per telda (dari seluruh data tanpa filter underperform)
    const allItems = Array.from(map.values());
    const teldaMap = new Map<string, Set<string>>();
    for (const item of allItems) {
      const telda = item.telda || "-";
      if (!teldaMap.has(telda)) teldaMap.set(telda, new Set());
      const key = item.kodeSales || item.namaAr;
      teldaMap.get(telda)!.add(key);
    }
    const QUOTA_PER_TELDA = 2;
    const teldaStats = Array.from(teldaMap.entries())
      .map(([telda, arSet]) => ({
        telda,
        arCount: arSet.size,
        kurang: arSet.size < QUOTA_PER_TELDA,
      }))
      .sort((a, b) => a.telda.localeCompare(b.telda));

    // Available witels & teldas
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
      teldaStats,
      underperformThreshold,
      periodMonths: monthCount,
    });
  } catch (err: any) {
    console.error("[ar-data]", err);
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
