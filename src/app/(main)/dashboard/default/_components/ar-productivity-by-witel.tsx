"use client";

import * as React from "react";
import useSWR from "swr";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

const chartConfig = {
  produktif: {
    label: "Produktif",
    color: "var(--chart-1)",
  },
  nonProduktif: {
    label: "Non-Produktif",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface ChartItem {
  witel: string;
  produktif: number;
  nonProduktif: number;
  total: number;
}

interface Props {
  start?: string;
  end?: string;
  witel?: string;
}

// Custom label to show total at the right end of each stacked bar
function TotalLabel(props: any) {
  const { x, y, width, height, index, data } = props;
  const item: ChartItem | undefined = data?.[index];
  if (!item || item.total === 0) return null;
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      dominantBaseline="middle"
      fill="var(--muted-foreground)"
      fontSize={11}
    >
      {item.total}
    </text>
  );
}

export default function ARProductivityByWitelCard({
  start,
  end,
  witel,
}: Props) {
  const sp = useSearchParams();

  const resolvedStart = start || sp.get("start") || "";
  const resolvedEnd = end || sp.get("end") || "";
  const resolvedWitel = witel || sp.get("witel") || "ALL";

  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (resolvedStart && resolvedEnd) {
      p.set("start", resolvedStart);
      p.set("end", resolvedEnd);
    }
    p.set("witel", resolvedWitel);
    return p.toString();
  }, [resolvedStart, resolvedEnd, resolvedWitel]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/ar-productivity-by-witel?${qs}`,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const chartData: ChartItem[] = data?.items ?? [];

  const totalProduktif = chartData.reduce((s, d) => s + d.produktif, 0);
  const totalAll = chartData.reduce((s, d) => s + d.total, 0);
  const pct =
    totalAll > 0 ? ((totalProduktif / totalAll) * 100).toFixed(1) : "0";

  const chartHeight = Math.max(220, chartData.length * 48 + 32);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AR Produktif vs Non-Produktif per Witel</CardTitle>
        <CardDescription>
          Berdasarkan sales &gt; 3 · {pct}% produktif dari {totalAll} AR
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
                className="h-7 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        )}
        {!error && !isLoading && chartData.length === 0 && (
          <div className="text-sm text-muted-foreground">Tidak ada data.</div>
        )}
        {!error && !isLoading && chartData.length > 0 && (
          <ChartContainer
            config={chartConfig}
            style={{ height: chartHeight, width: "100%" }}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={28}
              margin={{ left: 0, right: 44, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="witel"
                type="category"
                tickLine={false}
                axisLine={false}
                width={90}
                tick={{ fontSize: 12 }}
              />
              <XAxis type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {/* Produktif — left segment */}
              <Bar
                dataKey="produktif"
                stackId="a"
                fill="var(--color-produktif)"
                radius={[4, 0, 0, 4]}
              />
              {/* Non-Produktif — right segment, carries the total label */}
              <Bar
                dataKey="nonProduktif"
                stackId="a"
                fill="var(--color-nonProduktif)"
                radius={[0, 4, 4, 0]}
                label={<TotalLabel data={chartData} />}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
