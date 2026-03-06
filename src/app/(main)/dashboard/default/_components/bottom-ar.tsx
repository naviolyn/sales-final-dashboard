"use client";

import useSWR from "swr";
import { useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWitelColor } from "@/lib/witel-colors";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function WitelBadge({ witel }: { witel: string }) {
  const color = getWitelColor(witel);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        borderColor: color,
        color: color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: color }}
      />
      {witel}
    </span>
  );
}

export default function BottomARListCard() {
  const sp = useSearchParams();

  const start = sp.get("start") || "";
  const end = sp.get("end") || "";
  const month = sp.get("month") || "";
  const witel = sp.get("witel") || "ALL";

  const qs = new URLSearchParams();
  if (start && end) {
    qs.set("start", start);
    qs.set("end", end);
  } else if (month) {
    qs.set("month", month);
  }
  qs.set("witel", witel);
  qs.set("bottomN", "5");

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/bottom-ar?${qs.toString()}`,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const items = data?.items ?? [];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Bottom 5 AR (Sales Terendah)</CardTitle>
        <CardDescription>
          {data?.months?.length
            ? `Periode: ${data.months.join(", ")}`
            : "Periode: -"}{" "}
          • Witel: {data?.witel ?? witel}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-sm text-destructive">Gagal memuat data.</div>
        )}

        {!error && isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b p-2"
              >
                <div className="space-y-1">
                  <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-10 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {!error && !isLoading && items.length === 0 && (
          <div className="text-sm text-muted-foreground">Tidak ada data.</div>
        )}

        {!error && !isLoading && items.length > 0 && (
          <div className="space-y-1">
            {items.map((it: any, idx: number) => {
              const color = getWitelColor(it.witel);
              return (
                <div
                  key={`${it.kodeSales}-${idx}`}
                  className="flex items-center justify-between rounded-lg border-b px-2 py-2.5 last:border-0"
                >
                  {/* Kiri: nomor + nama + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Nomor urut dengan warna witel */}
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: `color-mix(in srgb, ${color} 15%, transparent)`,
                        color,
                      }}
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">
                        {it.namaAr}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {it.kodeSales && (
                          <span className="text-xs text-muted-foreground">
                            {it.kodeSales}
                          </span>
                        )}
                        <WitelBadge witel={it.witel} />
                      </div>
                    </div>
                  </div>

                  {/* Kanan: angka sales */}
                  <div className="text-right shrink-0 pl-3">
                    <div className="font-semibold tabular-nums text-sm">
                      {fmtNumber(it.sales)}
                    </div>
                    <div className="text-xs text-muted-foreground">Sales</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {data?.lastSync
            ? `Sync: ${new Date(data.lastSync).toLocaleString("id-ID")}`
            : ""}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {!isLoading ? `Total Sales: ${fmtNumber(data?.totalSales ?? 0)}` : ""}
        </span>
      </CardFooter>
    </Card>
  );
}
