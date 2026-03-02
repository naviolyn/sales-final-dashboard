"use client";

import useSWR from "swr";
import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SummaryCard = {
  id: "total_sales" | "total_poi" | "total_collection" | "ar_productive";
  title: string;
  value: number;
  unit?: "number" | "currency" | "percent";
  deltaPct?: number | null;
  subtitle?: string;
};

type SummaryResponse = {
  cards: SummaryCard[];
  lastSync: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatMonthLabel(key?: string) {
  if (!key) return "-";

  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;

  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function formatRangeLabel(start?: string, end?: string) {
  if (!start) return "-";
  if (!end || start === end) return formatMonthLabel(start);

  return `${formatMonthLabel(start)} – ${formatMonthLabel(end)}`;
}

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
  start,
  end,
  witel,
}: {
  start?: string;
  end?: string;
  witel?: string;
}) {
  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);
  if (witel && witel !== "ALL") qs.set("witel", witel);

  const { data, isLoading, error } = useSWR<SummaryResponse>(
    `/api/summary?${qs.toString()}`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    }
  );

  const cards = data?.cards ?? [];

  if (error)
    return <div className="text-sm text-destructive">Gagal load summary.</div>;

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

          const d = c.deltaPct;
          const showDelta = typeof d === "number" && Number.isFinite(d);
          const isUp = showDelta ? d >= 0 : true;
          const TrendIcon = isUp ? TrendingUp : TrendingDown;

          return (
            <Card key={c.id} className="@container/card">
              <CardHeader>
                <CardDescription>{c.title}</CardDescription>

                <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
                  {formatValue(c.value, c.unit)}
                </CardTitle>

                <CardAction>
                  <Badge
                    variant="outline"
                    className={
                      !showDelta
                        ? "text-muted-foreground border-muted"
                        : d === 0
                        ? "text-muted-foreground border-muted"
                        : isUp
                        ? `
            text-emerald-600 border-emerald-300 bg-emerald-50
            dark:text-emerald-400 dark:border-emerald-500/40 dark:bg-emerald-500/10
          `
                        : `
            text-rose-600 border-rose-300 bg-rose-50
            dark:text-rose-400 dark:border-rose-500/40 dark:bg-rose-500/10
          `
                    }
                  >
                    {showDelta ? <TrendIcon className="mr-1 size-4" /> : null}
                    {showDelta ? `${isUp ? "+" : ""}${d.toFixed(1)}%` : "—"}
                  </Badge>
                </CardAction>

                {/* <div className="text-xs text-muted-foreground">
                  Periode: {formatRangeLabel(start, end)}
                  {witel && witel !== "ALL" ? ` • Witel: ${witel}` : ""}
                </div> */}
              </CardHeader>
            </Card>
          );
        }
      )}
    </div>
  );
}
