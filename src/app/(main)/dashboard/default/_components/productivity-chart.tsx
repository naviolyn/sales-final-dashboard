"use client";

import * as React from "react";
import useSWR from "swr";
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
import { getWitelColor } from "@/lib/witel-colors";

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

// Dot dan nama sejajar horizontal
function WitelTick(props: any) {
  const { x, y, payload } = props;
  const color = getWitelColor(payload.value);
  return (
    <g transform={`translate(${x},${y + 10})`}>
      {/* dot di kiri, nama di kanan — keduanya di baris yang sama (cy=0) */}
      <circle
        cx={-Math.ceil(payload.value.length * 3.2) - 6}
        cy={0}
        r={4}
        fill={color}
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fill="currentColor"
      >
        {payload.value}
      </text>
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const witelColor = getWitelColor(label ?? "");
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <div className="mb-1.5 flex items-center gap-1.5 font-medium">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: witelColor }}
        />
        {label}
      </div>
      {payload.map((p: any) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-4"
        >
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ background: p.fill }}
            />
            {chartConfig[p.dataKey as keyof typeof chartConfig]?.label ??
              p.dataKey}
          </span>
          <span className="tabular-nums font-medium">{p.value}</span>
        </div>
      ))}
    </div>
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

  // Lebar per witel lebih longgar supaya bar bisa lebar
  const chartWidth = Math.max(500, chartData.length * 130);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AR Produktif vs Non-Produktif per Witel</CardTitle>
        <CardDescription>
          Berdasarkan sales &gt; 3 · {pct}% produktif dari {totalAll} AR
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
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
            style={{ height: 320, minWidth: chartWidth, width: "100%" }}
          >
            <BarChart
              data={chartData}
              barCategoryGap="25%"
              barGap={3}
              margin={{ left: 8, right: 8, top: 24, bottom: 32 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="witel"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={<WitelTick />}
                height={44}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                width={28}
              />
              <ChartTooltip cursor={false} content={<CustomTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />

              <Bar
                dataKey="produktif"
                fill="var(--color-produktif)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              >
                <LabelList
                  dataKey="produktif"
                  position="top"
                  style={{ fontSize: 11, fill: "var(--foreground)" }}
                />
              </Bar>
              <Bar
                dataKey="nonProduktif"
                fill="var(--color-nonProduktif)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              >
                <LabelList
                  dataKey="nonProduktif"
                  position="top"
                  style={{ fontSize: 11, fill: "var(--foreground)" }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
