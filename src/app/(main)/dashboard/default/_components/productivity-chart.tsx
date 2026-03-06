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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

const chartConfig = {
  produktif: { label: "Produktif", color: "var(--chart-1)" },
  nonProduktif: { label: "Non-Produktif", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function ProductivityChart({
  start,
  end,
  witel,
}: {
  start?: string;
  end?: string;
  witel?: string;
}) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    }
    p.set("witel", witel ?? "ALL");
    p.set("metric", "sales");
    p.set("breakdown", "witel");
    return p.toString();
  }, [start, end, witel]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/ar-productivity?${qs}`,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const produktif: number = data?.produktif ?? 0;
  const nonProduktif: number = data?.nonProduktif ?? 0;
  const total = produktif + nonProduktif;
  const produktifPct = total > 0 ? ((produktif / total) * 100).toFixed(1) : "0";

  const rawBreakdown: {
    witel: string;
    produktif: number;
    nonProduktif: number;
  }[] = data?.byWitel ?? [];

  const chartData = React.useMemo(() => {
    if (rawBreakdown.length > 0) return rawBreakdown;
    return [{ witel: "Semua", produktif, nonProduktif }];
  }, [rawBreakdown, produktif, nonProduktif]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AR Produktif vs Non-Produktif</CardTitle>
        <CardDescription>
          AR dengan sales lebih dari 3 dianggap produktif
          {!isLoading && total > 0
            ? ` · ${produktifPct}% produktif dari ${total} AR`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-destructive">Gagal load data.</div>
        ) : isLoading ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
            Memuat...
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              data={chartData}
              barCategoryGap="20%"
              barGap={4}
              margin={{ top: 16, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="witel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tick={{ fontSize: 11 }}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      value,
                      name === "produktif" ? " Produktif" : " Non-Produktif",
                    ]}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />

              <Bar
                dataKey="produktif"
                fill="var(--color-produktif)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!isLoading}
              >
                <LabelList
                  dataKey="produktif"
                  position="top"
                  className="fill-foreground text-xs font-medium"
                />
              </Bar>

              <Bar
                dataKey="nonProduktif"
                fill="var(--color-nonProduktif)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!isLoading}
              >
                <LabelList
                  dataKey="nonProduktif"
                  position="top"
                  className="fill-foreground text-xs font-medium"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
