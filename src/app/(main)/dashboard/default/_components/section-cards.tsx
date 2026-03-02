"use client";

import useSWR from "swr";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type SummaryCard = {
  id: string;
  title: string;
  value: number;
  unit?: "number" | "currency" | "percent";
  deltaPct?: number;
  subtitle?: string;
};

type SummaryResponse = {
  cards: SummaryCard[];
  lastSync: string;
  months: string[];
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

export function SectionCards() {
  // TODO: ganti months dari global filter (query param / context)
  const months = ["2026-01", "2026-02", "2026-03"];
  const qs = new URLSearchParams({ months: months.join(",") });

  const { data, isLoading, error } = useSWR<SummaryResponse>(`/api/summary?${qs.toString()}`, fetcher, {
    refreshInterval: 30_000, // polling 30 detik
    revalidateOnFocus: true,
  });

  const cards = data?.cards ?? [];

  if (error) {
    return <div className="text-sm text-destructive">Gagal load summary.</div>;
  }

  return (
    <div className="grid @5xl/main:grid-cols-4 @xl/main:grid-cols-2 grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
      {(isLoading ? Array.from({ length: 4 }) : cards.slice(0, 4)).map((c: any, idx: number) => {
        if (isLoading) {
          return (
            <Card key={idx} className="@container/card">
              <CardHeader>
                <CardDescription className="h-4 w-24 bg-muted rounded" />
                <CardTitle className="h-8 w-40 bg-muted rounded" />
              </CardHeader>
              <CardFooter className="h-10 bg-muted/40 rounded m-4" />
            </Card>
          );
        }

        const delta = c.deltaPct ?? 0;
        const isUp = delta >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;

        return (
          <Card key={c.id} className="@container/card">
            <CardHeader>
              <CardDescription>{c.title}</CardDescription>
              <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
                {formatValue(c.value, c.unit)}
              </CardTitle>

              <CardAction>
                <Badge variant="outline">
                  <TrendIcon />
                  {`${isUp ? "+" : ""}${delta.toFixed(1)}%`}
                </Badge>
              </CardAction>
            </CardHeader>

            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {isUp ? "Naik" : "Turun"} dibanding periode sebelumnya <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {c.subtitle ?? `Last sync: ${new Date(data!.lastSync).toLocaleString("id-ID")}`}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
