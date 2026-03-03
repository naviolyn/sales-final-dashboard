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
import { Pie, PieChart, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig,
} from "@/components/ui/chart";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function WitelDistribution({
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
    if (witel && witel !== "ALL") p.set("witel", witel);
    else p.set("witel", "ALL");
    p.set("topN", "6");
    p.set("metric", metric);
    return p.toString();
  }, [start, end, witel, metric]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/witel-sales?${qs}`,
    fetcher,
    { refreshInterval: 60_000 }
  );
  const items: any[] = data?.items ?? [];

  const chartData = items.map((x, idx) => ({
    name: x.witel,
    value: Number(x[metric] ?? 0),
    fill: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  const totalValue = Number(data?.totalSales ?? 0);

  const config = React.useMemo(() => {
    const cfg: Record<string, any> = {};
    for (const d of chartData) cfg[d.name] = { label: d.name, color: d.fill };
    return cfg as ChartConfig;
  }, [chartData]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{metricLabel} per Witel</CardTitle>
        <CardDescription>
          Distribusi {metricLabel.toLowerCase()} berdasarkan witel
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {error ? (
          <div className="text-sm text-destructive">Gagal load data.</div>
        ) : (
          <ChartContainer config={config} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                cornerRadius={4}
                isAnimationActive={!isLoading}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground font-bold text-3xl tabular-nums"
                          >
                            {isLoading ? "…" : fmtNumber(totalValue)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 22}
                            className="fill-muted-foreground text-sm"
                          >
                            Total {metricLabel}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
              <ChartLegend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                content={() => (
                  <ul className="ml-6 flex flex-col gap-2">
                    {chartData.map((item) => (
                      <li
                        key={item.name}
                        className="flex w-40 items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: item.fill }}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="tabular-nums">
                          {fmtNumber(item.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
