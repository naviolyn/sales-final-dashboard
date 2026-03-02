"use client";

import useSWR from "swr";
import * as React from "react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SummaryCard = {
  id: "total_sales" | "total_poi" | "total_collection";
  title: string;
  value: number;
  unit?: "number" | "currency" | "percent";
  subtitle?: string;
};

type SummaryResponse = {
  cards: SummaryCard[];
  lastSync: string;
  months: string[]; // daftar bulan available (nama sheet)
  selectedMonth?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatValue(value: number, unit?: SummaryCard["unit"]) {
  if (unit === "currency") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "percent") return `${value.toFixed(1)}%`;
  return new Intl.NumberFormat("id-ID").format(value);
}

export function SectionCards({
  month,
  witel,
}: {
  month?: string;
  witel?: string;
}) {
  const qs = new URLSearchParams();
  if (month) qs.set("month", month);
  if (witel && witel !== "ALL") qs.set("witel", witel); // bisa "ACEH" atau "ACEH,SUMUT"

  const { data, isLoading, error } = useSWR<SummaryResponse>(
    `/api/summary?${qs.toString()}`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    }
  );

  const resolvedMonth = React.useMemo(() => {
    if (month) return month;
    if (data?.selectedMonth) return data.selectedMonth;
    const ms = data?.months ?? [];
    return ms.length ? ms[ms.length - 1] : "";
  }, [month, data?.selectedMonth, data?.months]);

  const cards = React.useMemo(() => {
    // pastikan urutan selalu: sales, poi, coll
    const map = new Map((data?.cards ?? []).map((c) => [c.id, c] as const));
    return [
      map.get("total_sales"),
      map.get("total_poi"),
      map.get("total_collection"),
    ].filter(Boolean) as SummaryCard[];
  }, [data?.cards]);

  if (error) {
    return <div className="text-sm text-destructive">Gagal load summary.</div>;
  }

  return (
    <div className="grid @xl/main:grid-cols-3 grid-cols-1 gap-4">
      {(isLoading ? Array.from({ length: 3 }) : cards).map(
        (c: any, idx: number) => {
          if (isLoading) {
            return (
              <Card key={idx} className="@container/card">
                <CardHeader>
                  <CardDescription className="h-4 w-24 bg-muted rounded" />
                  <CardTitle className="h-8 w-40 bg-muted rounded" />
                </CardHeader>
              </Card>
            );
          }

          return (
            <Card key={c.id} className="@container/card">
              <CardHeader>
                <CardDescription>{c.title}</CardDescription>
                <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
                  {formatValue(c.value, c.unit)}
                </CardTitle>

                <div className="text-xs text-muted-foreground">
                  Periode: {resolvedMonth || "-"}
                  {witel && witel !== "ALL" ? ` • Witel: ${witel}` : ""}
                </div>
              </CardHeader>
            </Card>
          );
        }
      )}
    </div>
  );
}
