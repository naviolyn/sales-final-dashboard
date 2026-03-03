"use client";

import * as React from "react";
import useSWR from "swr";
import { Pie, PieChart, Label } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig,
} from "@/components/ui/chart";

import { Card, CardContent } from "@/components/ui/card";

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

export default function BestWitelPieCard({
  start,
  end,
  witels,
}: {
  start: string;
  end: string;
  witels: string[];
}) {
  const qs = React.useMemo(() => {
    if (!start || !end) return null;

    const p = new URLSearchParams();
    p.set("start", start);
    p.set("end", end);
    p.set("witel", witels.length ? witels.join(",") : "ALL");
    p.set("topN", "6");

    return p.toString();
  }, [start, end, witels]);

  const { data, isLoading, error } = useSWR(
    qs ? `/api/dashboard/witel-sales?${qs}` : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const items: { witel: string; sales: number }[] = data?.items ?? [];

  const chartData = items.map((x, idx) => ({
    name: x.witel,
    sales: Number(x.sales ?? 0),
    fill: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  const totalSales = Number(data?.totalSales ?? 0);

  const config = React.useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    for (const d of chartData) {
      cfg[d.name] = { label: d.name, color: d.fill };
    }
    return cfg as ChartConfig;
  }, [chartData]);

  return (
    <Card className="h-[300px] w-full">
      <CardContent className="h-full flex items-center justify-center">
        {error ? (
          <div className="text-sm text-destructive">Gagal load data Witel.</div>
        ) : (
          <ChartContainer config={config} className="w-full h-full">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />

              <Pie
                data={chartData}
                dataKey="sales"
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
                            {isLoading ? "…" : fmtNumber(totalSales)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 22}
                            className="fill-muted-foreground text-sm"
                          >
                            Total Sales
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
                          {fmtNumber(item.sales)}
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
