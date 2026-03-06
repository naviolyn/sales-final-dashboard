"use client";

import * as React from "react";
import useSWR from "swr";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
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
import { getWitelColor } from "@/lib/witel-colors";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

// Config tetap untuk legend label — warna di-override Cell
const chartConfig = {
  produktif: { label: "Produktif", color: "var(--chart-1)" },
  nonProduktif: { label: "Non-Produktif", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** Warna witel penuh → untuk segment Produktif */
function solidColor(witel: string) {
  return getWitelColor(witel);
}

/** Warna witel + opacity 40% → untuk segment Non-Produktif */
function fadedColor(witel: string) {
  const c = getWitelColor(witel);
  // Gunakan color-mix untuk fade — didukung semua browser modern
  return `color-mix(in srgb, ${c} 40%, white)`;
}

// Total di ujung kanan bar
function TotalLabel(props: any) {
  const { x, y, width, height, index, data } = props;
  const item = data?.[index];
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

// YAxis tick: dot warna witel + nama sejajar
function WitelTick(props: any) {
  const { x, y, payload } = props;
  const color = getWitelColor(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={-82} cy={0} r={4} fill={color} />
      <text
        x={-74}
        y={0}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12}
        fill="currentColor"
      >
        {payload.value}
      </text>
    </g>
  );
}

// Tooltip dengan dot warna witel di header
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
  const pct = total > 0 ? ((produktif / total) * 100).toFixed(1) : "0";

  const rawBreakdown: {
    witel: string;
    produktif: number;
    nonProduktif: number;
  }[] = data?.byWitel ?? [];

  const chartData = React.useMemo(() => {
    const rows =
      rawBreakdown.length > 0
        ? rawBreakdown
        : [{ witel: "Semua", produktif, nonProduktif }];
    return rows.map((r) => ({ ...r, total: r.produktif + r.nonProduktif }));
  }, [rawBreakdown, produktif, nonProduktif]);

  const chartHeight = Math.max(220, chartData.length * 52 + 32);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AR Produktif vs Non-Produktif</CardTitle>
        <CardDescription>
          {metricLabel} lebih dari 3 ·{" "}
          <span className="font-bold">{isLoading ? "…" : `${pct}% produktif dari ${total} AR`}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-sm text-destructive">Gagal load data.</div>
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
              margin={{ left: 8, right: 44, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} />

              <YAxis
                dataKey="witel"
                type="category"
                tickLine={false}
                axisLine={false}
                width={96}
                tick={<WitelTick />}
              />
              <XAxis type="number" hide />

              <ChartTooltip cursor={false} content={<CustomTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />

              {/* Segment Produktif — warna penuh sesuai witel */}
              <Bar
                dataKey="produktif"
                stackId="a"
                radius={[4, 0, 0, 4]}
                isAnimationActive={!isLoading}
              >
                {chartData.map((d, i) => (
                  <Cell key={`prod-${i}`} fill={solidColor(d.witel)} />
                ))}
                <LabelList
                  dataKey="produktif"
                  position="insideRight"
                  offset={6}
                  style={{ fontSize: 11, fontWeight: 600, fill: "#fff" }}
                  formatter={(v: number) => (v > 0 ? v : "")}
                />
              </Bar>

              {/* Segment Non-Produktif — warna faded sesuai witel + total di luar */}
              <Bar
                dataKey="nonProduktif"
                stackId="a"
                radius={[0, 4, 4, 0]}
                isAnimationActive={!isLoading}
                label={<TotalLabel data={chartData} />}
              >
                {chartData.map((d, i) => (
                  <Cell key={`nonprod-${i}`} fill={fadedColor(d.witel)} />
                ))}
                <LabelList
                  dataKey="nonProduktif"
                  position="insideLeft"
                  offset={6}
                  style={{ fontSize: 11, fontWeight: 600, fill: "#fff" }}
                  formatter={(v: number) => (v > 0 ? v : "")}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
