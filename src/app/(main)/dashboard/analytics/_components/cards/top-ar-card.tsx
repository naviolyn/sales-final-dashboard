"use client";

import * as React from "react";
import useSWR from "swr";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

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

interface TopARCardProps {
  metric: "sales" | "poi" | "coll";
  metricLabel: string;
  start: string;
  end: string;
  witel: string;
}

export function TopARCard({
  metric,
  metricLabel,
  start,
  end,
  witel,
}: TopARCardProps) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    }
    p.set("witel", witel && witel !== "ALL" ? witel : "ALL");
    p.set("topN", "5");
    p.set("metric", metric);
    return p.toString();
  }, [start, end, witel, metric]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/top-ar?${qs}`,
    fetcher,
    { refreshInterval: 60_000 }
  );

  const chartData = React.useMemo(() => {
    return (data?.items ?? []).map((x: any) => ({
      shortName: shortName(x.namaAr),
      fullName: x.namaAr,
      value: Number(x[metric] ?? 0),
      witel: x.witel,
    }));
  }, [data?.items, metric]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top 5 AR by {metricLabel}</CardTitle>
        <CardDescription>
          AR dengan {metricLabel.toLowerCase()} tertinggi
        </CardDescription>
      </CardHeader>

      <CardContent className="size-full">
        {error ? (
          <div className="text-sm text-destructive">Gagal load data.</div>
        ) : isLoading ? (
          <div className="text-sm text-muted-foreground">Memuat...</div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={36}
              margin={{ left: 0, right: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="shortName"
                type="category"
                tickLine={false}
                axisLine={false}
                hide
              />
              <XAxis type="number" hide />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullName ?? _label;
                    }}
                    formatter={(value, _name, item) => {
                      const payload: any = item?.payload;
                      return [
                        fmtNumber(Number(value)),
                        " ",
                        `${metricLabel} • ${payload?.witel ?? ""}`,
                      ];
                    }}
                  />
                }
              />

              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[6, 6, 6, 6]}
              >
                <LabelList
                  dataKey="shortName"
                  position="insideLeft"
                  offset={8}
                  className="fill-primary-foreground text-sm"
                />
                <LabelList
                  dataKey="value"
                  position="insideRight"
                  offset={8}
                  className="fill-primary-foreground text-sm tabular-nums"
                  formatter={(v: any) => fmtNumber(Number(v))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
