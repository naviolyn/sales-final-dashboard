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
    return p.toString();
  }, [start, end, witel, metric]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/ar-productivity?${qs}`,
    fetcher
  );
  const produktif = data?.produktif ?? 0;
  const nonProduktif = data?.nonProduktif ?? 0;
  const total = produktif + nonProduktif;
  const chartData = [
    { name: "Produktif", value: produktif, fill: "var(--chart-1)" },
    { name: "Non-Produktif", value: nonProduktif, fill: "var(--chart-3)" },
  ];
  const produktifPct = total > 0 ? ((produktif / total) * 100).toFixed(1) : "0";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AR Produktif vs Non-Produktif</CardTitle>
        <CardDescription>
          AR produktif ({metricLabel} lebih dari 3)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {error ? (
          <div className="text-sm text-destructive">Gagal load data.</div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                paddingAngle={4}
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
                            className="fill-foreground font-bold text-3xl"
                          >
                            {isLoading ? "..." : `${produktifPct}%`}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 22}
                            className="fill-muted-foreground text-sm"
                          >
                            Produktif
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
                          <span>{item.name}</span>
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
