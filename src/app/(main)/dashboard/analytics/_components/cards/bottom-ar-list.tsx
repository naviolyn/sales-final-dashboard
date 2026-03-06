"use client";
import * as React from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
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

function shortName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
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

export function BottomARList({ metric, metricLabel, start, end, witel }: any) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    }
    p.set("witel", witel);
    p.set("bottomN", "5");
    p.set("metric", metric);
    return p.toString();
  }, [start, end, witel, metric]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/bottom-ar?${qs}`,
    fetcher,
    { refreshInterval: 60_000 }
  );
  const items = data?.items ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Bottom 5 AR by {metricLabel}</CardTitle>
        <CardDescription>
          AR dengan {metricLabel.toLowerCase()} terendah
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
                className="flex items-center justify-between border-b pb-3 last:border-b-0"
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
                  {/* Kiri */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Nomor urut berwarna witel */}
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
                      <div
                        className="font-medium truncate text-sm"
                        title={it.namaAr}
                      >
                        {shortName(it.namaAr)}
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

                  {/* Kanan */}
                  <div className="text-right shrink-0 pl-3">
                    <div className="font-semibold tabular-nums text-sm">
                      {fmtNumber(it[metric] ?? 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metricLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
