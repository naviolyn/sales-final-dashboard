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

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function formatMonthLabel(key?: string) {
  if (!key) return "-";
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function formatRangeLabel(months: string[]) {
  if (!months?.length) return "-";
  const start = months[0];
  const end = months[months.length - 1];
  return start === end
    ? formatMonthLabel(start)
    : `${formatMonthLabel(start)} – ${formatMonthLabel(end)}`;
}

// warna pakai CSS var supaya nyatu sama theme (light/dark)
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
  witel,
  topN = 6,
}: {
  start?: string;
  end?: string;
  witel?: string; // "ALL" atau "Aceh,Sumut"
  topN?: number;
}) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    if (witel && witel !== "ALL") p.set("witel", witel);
    else p.set("witel", "ALL");
    p.set("topN", String(topN));
    return p.toString();
  }, [start, end, witel, topN]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/witel-sales?${qs}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    }
  );

  const items: { witel: string; sales: number }[] = data?.items ?? [];
  const months: string[] = data?.months ?? [];

const chartData = items.map((x, idx) => ({
  name: x.witel,
  sales: Number(x.sales ?? 0),
  fill: PIE_COLORS[idx % PIE_COLORS.length], // 👈 IMPORTANT: pakai `fill`
}));
// function toHsl(varRef: string) {
//   return `hsl(${varRef})`;
// }
  const totalSales = Number(data?.totalSales ?? 0);

  // ChartConfig untuk legend label
const config = React.useMemo(() => {
  const cfg: Record<string, { label: string; color: string }> = {};
  for (const d of chartData) cfg[d.name] = { label: d.name, color: d.fill };
  return cfg as ChartConfig;
}, [chartData]);

  return (
    <Card className="col-span-1 xl:col-span-2 h-full">
      <CardHeader className="pb-2">
        <CardTitle>Witel Terbaik (Sales)</CardTitle>
        <CardDescription>
          Periode: {formatRangeLabel(months)}{" "}
          {data?.witel ? `• Witel filter: ${data.witel}` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="max-h-48">
        {error ? (
          <div className="text-sm text-destructive">Gagal load data Witel.</div>
        ) : (
          <div className="w-full">
            <ChartContainer config={config} className="">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
                              y={(viewBox.cy ?? 0) + 24}
                              className="fill-muted-foreground"
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
                    <ul className="ml-8 flex flex-col gap-3">
                      {chartData.map((item) => (
                        <li
                          key={item.name}
                          className="flex w-44 items-center justify-between"
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
