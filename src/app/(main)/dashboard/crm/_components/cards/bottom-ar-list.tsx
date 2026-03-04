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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

/** "john doe smith" -> "John Doe" (max 2 kata, title case) */
function shortName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
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
          <div className="text-sm text-muted-foreground">Memuat...</div>
        )}
        {!error && !isLoading && items.length === 0 && (
          <div className="text-sm text-muted-foreground">Tidak ada data.</div>
        )}
        {!error && !isLoading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((it: any, idx: number) => (
              <div
                key={`${it.kodeSales}-${idx}`}
                className="flex items-center justify-between border-b pb-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  {/* Nama pendek ditampilkan, nama full di title (hover) */}
                  <div className="font-medium truncate" title={it.namaAr}>
                    {idx + 1}. {shortName(it.namaAr)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {it.kodeSales ? `Kode: ${it.kodeSales} ` : ""}Witel:{" "}
                    {it.witel}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold tabular-nums">
                    {fmtNumber(it[metric] ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metricLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
