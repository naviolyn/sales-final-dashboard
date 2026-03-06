"use client";

import * as React from "react";
import useSWR from "swr";
import { Pie, PieChart, Label } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getWitelColor } from "@/lib/witel-colors";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function BestWitelPieCard({
  range,
  witel,
}: {
  range: "3m" | "6m" | "1y";
  witel: string;
}) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    p.set("range", range);
    p.set("witel", witel ?? "ALL");
    return p.toString();
  }, [range, witel]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/witel-sales?${qs}`,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const items: { witel: string; sales: number }[] = data?.items ?? [];

  const chartData = items.map((x) => ({
    name: x.witel,
    sales: Number(x.sales ?? 0),
    fill: getWitelColor(x.witel), // ← pakai nama, bukan index
  }));

  const totalSales = Number(data?.totalSales ?? 0);

  const config = React.useMemo<ChartConfig>(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    for (const d of chartData) cfg[d.name] = { label: d.name, color: d.fill };
    return cfg as ChartConfig;
  }, [chartData]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        Gagal load data Witel.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {/* <p className="mb-3 text-sm font-medium text-muted-foreground">
        Distribusi per Witel
      </p> */}
      <div className="flex items-center gap-2">
        <ChartContainer
          config={config}
          className="h-[220px] w-[220px] shrink-0"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="sales"
              nameKey="name"
              innerRadius={72}
              outerRadius={100}
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
                          className="fill-foreground text-2xl font-bold tabular-nums"
                        >
                          {isLoading ? "…" : fmtNumber(totalSales)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 20}
                          className="fill-muted-foreground text-xs"
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
          </PieChart>
        </ChartContainer>

        <ul className="flex flex-col gap-2">
          {chartData.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: item.fill }}
                />
                <span className="max-w-[90px] truncate">{item.name}</span>
              </span>
              <span className="tabular-nums font-medium">
                {fmtNumber(item.sales)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
