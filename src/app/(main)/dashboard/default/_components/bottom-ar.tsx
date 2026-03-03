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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
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
                className="flex items-center justify-between border-b p-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {idx + 1}. {it.namaAr}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {it.kodeSales ? `Kode: ${it.kodeSales} • ` : ""}
                    Witel: {it.witel}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold tabular-nums">
                    {fmtNumber(it.sales)}
                  </div>
                  <div className="text-xs text-muted-foreground">Sales</div>
                </div>
              </div>
            ))}
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
