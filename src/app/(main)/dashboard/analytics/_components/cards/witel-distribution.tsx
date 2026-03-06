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
    p.set("witel", witel && witel !== "ALL" ? witel : "ALL");
    p.set("metric", metric);
    return p.toString();
  }, [start, end, witel, metric]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/witel-sales?${qs}`,
    fetcher,
    { refreshInterval: 60_000 }
  );

  const items: any[] = data?.items ?? [];

  const chartData = items.map((x) => ({
    name: x.witel,
    value: Number(x[metric] ?? 0),
    fill: getWitelColor(x.witel),
  }));

  const totalValue =
    metric === "poi"
      ? Number(data?.totalPoi ?? 0)
      : metric === "coll"
      ? Number(data?.totalColl ?? 0)
      : Number(data?.totalSales ?? 0);

  const config = React.useMemo<ChartConfig>(() => {
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

      <CardContent className="pb-4 px-4">
        {error ? (
          <div className="text-sm text-destructive">Gagal load data.</div>
        ) : isLoading ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Memuat...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Tidak ada data.
          </div>
        ) : (
          /* Donut + legend — stack vertikal selalu, legend di bawah */
          <div className="flex flex-col items-center gap-5">
            <ChartContainer
              config={config}
              className="h-[200px] w-[200px] shrink-0"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
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
                              className="fill-foreground text-xl font-bold tabular-nums"
                            >
                              {fmtNumber(totalValue)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 18}
                              className="fill-muted-foreground text-xs"
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
              </PieChart>
            </ChartContainer>

            {/* Legend: full width, list vertikal, tidak overflow */}
            <ul className="w-full space-y-1.5 px-4">
              {chartData.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: item.fill }}
                    />
                    <span className="truncate text-sm text-muted-foreground">
                      {item.name}
                    </span>
                  </span>
                  <span className=" text-sm shrink-0 tabular-nums font-medium">
                    {fmtNumber(item.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
