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
  id: "total_sales" | "total_poi" | "total_collection" | "ar_productive";
  title: string;
  value: number;
  unit?: "number" | "currency" | "percent";
  subtitle?: string;
};

type SummaryResponse = {
  cards: SummaryCard[];
  lastSync: string;

  months: string[]; // available months (YYYY-MM)
  selectedMonths?: string[]; // dari API summary (optional)
  last3Months?: string[]; // optional
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

function formatPeriodLabel(months?: string[]) {
  if (!months || months.length === 0) return "-";
  if (months.length === 1) return months[0];
  return `${months.length} bulan (${months.join(", ")})`;
}

export function SectionCards({
  months,
  witel,
}: {
  months?: string[];
  witel?: string;
}) {
  const qs = new URLSearchParams();
  if (months?.length) qs.set("months", months.join(","));
  if (witel && witel !== "ALL") qs.set("witel", witel); // "Aceh" atau "Aceh,Sumut"

  const { data, isLoading, error } = useSWR<SummaryResponse>(
    `/api/summary?${qs.toString()}`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    }
  );

  const resolvedMonths = React.useMemo(() => {
    // kalau props months ada, pakai itu
    if (months?.length) return months;
    // fallback kalau API mengirim selectedMonths
    if (data?.selectedMonths?.length) return data.selectedMonths;
    // fallback terakhir: ambil last available
    const ms = data?.months ?? [];
    return ms.length ? [ms[ms.length - 1]] : [];
  }, [months, data?.selectedMonths, data?.months]);

  const cards = React.useMemo(() => {
    const map = new Map((data?.cards ?? []).map((c) => [c.id, c] as const));
    return [
      map.get("total_sales"),
      map.get("total_poi"),
      map.get("total_collection"),
      map.get("ar_productive"),
    ].filter(Boolean) as SummaryCard[];
  }, [data?.cards]);

  if (error) {
    return <div className="text-sm text-destructive">Gagal load summary.</div>;
  }

  return (
    <div className="grid @5xl/main:grid-cols-4 @xl/main:grid-cols-2 grid-cols-1 gap-4">
      {(isLoading ? Array.from({ length: 4 }) : cards).map(
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
                  Periode: {formatPeriodLabel(resolvedMonths)}
                  {witel && witel !== "ALL" ? ` • Witel: ${witel}` : ""}
                </div>

                {c.subtitle ? (
                  <div className="text-xs text-muted-foreground">
                    {c.subtitle}
                  </div>
                ) : null}
              </CardHeader>
            </Card>
          );
        }
      )}
    </div>
  );
}
