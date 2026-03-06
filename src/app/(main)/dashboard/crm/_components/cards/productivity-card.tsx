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
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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

export function ProductivityCard({
  metric,
  metricLabel,
  start,
  end,
  witel,
}: any) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    }
    p.set("witel", witel);
    p.set("metric", metric);
    // Minta breakdown per witel
    p.set("breakdown", "witel");
    return p.toString();
  }, [start, end, witel, metric]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/ar-productivity?${qs}`,
    fetcher
  );

  const produktif: number = data?.produktif ?? 0;
  const nonProduktif: number = data?.nonProduktif ?? 0;
  const total = produktif + nonProduktif;
  const produktifPct = total > 0 ? ((produktif / total) * 100).toFixed(1) : "0";

  // Gunakan breakdown per witel jika tersedia, fallback ke agregat total
  const rawBreakdown: {
    witel: string;
    produktif: number;
    nonProduktif: number;
  }[] = data?.byWitel ?? [];

  const chartData = React.useMemo(() => {
    if (rawBreakdown.length > 0) return rawBreakdown;
    // fallback: satu bar "Semua"
    return [{ witel: "Semua", produktif, nonProduktif }];
  }, [rawBreakdown, produktif, nonProduktif]);

  const isGrouped = chartData.length > 1;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AR Produktif vs Non-Produktif</CardTitle>
        <CardDescription>
          AR produktif ({metricLabel} lebih dari 3) •{" "}
          {isLoading ? "..." : `${produktifPct}% produktif dari ${total} AR`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-destructive">Gagal load data.</div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={chartData}
              barCategoryGap={isGrouped ? "20%" : "40%"}
              barGap={4}
              margin={{ top: 16, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="witel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
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
