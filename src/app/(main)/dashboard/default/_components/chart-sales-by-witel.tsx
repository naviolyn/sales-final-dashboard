"use client";

import * as React from "react";
import useSWR from "swr";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "next/navigation";
import BestWitelPieCard from "../../default/_components/best-witel-pie-chart";






const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

function monthLabel(monthKey: string) {
  // "2025-11" -> "Nov 2025"
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

export function ChartSalesByWitel() {
  const isMobile = useIsMobile();
  const sp = useSearchParams();

  // kalau kamu sudah punya filter witel di header (?witel=ALL / nama witel)
  const witel = sp.get("witel") || "ALL";

  const [range, setRange] = React.useState<"3m" | "6m" | "1y">("3m");

  React.useEffect(() => {
    if (isMobile) setRange("3m");
  }, [isMobile]);

  const qs = new URLSearchParams();
  qs.set("range", range);
  qs.set("top", "5"); // top 5 witel kalau ALL
  if (witel) qs.set("witel", witel);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/sales-by-witel?${qs.toString()}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    }
  );

  // dynamic chart config dari series response
  const series: Array<{ key: string; label: string }> = data?.series ?? [];
  const chartConfig = React.useMemo(() => {
    const base: ChartConfig = {
      sales: { label: "Sales" },
    };
    // pakai chart tokens berurutan
    const tokens = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "var(--chart-6)",
    ];
    series.forEach((s, i) => {
      (base as any)[s.key] = {
        label: s.label,
        color: tokens[i % tokens.length],
      };
    });
    return base;
  }, [series]);

  const chartData = data?.data ?? [];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Sales per Witel</CardTitle>
        <CardDescription>
          {witel !== "ALL" ? `Witel: ${witel}` : "Top Witel (stacked)"} •
          Rentang:{" "}
          {range === "3m" ? "3 bulan" : range === "6m" ? "6 bulan" : "1 tahun"}
        </CardDescription>

        <CardAction>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v) => v && setRange(v as any)}
            variant="outline"
            className="@[767px]/card:flex hidden *:data-[slot=toggle-group-item]:px-4!"
          >
            <ToggleGroupItem value="3m">3 bulan</ToggleGroupItem>
            <ToggleGroupItem value="6m">6 bulan</ToggleGroupItem>
            <ToggleGroupItem value="1y">1 tahun</ToggleGroupItem>
          </ToggleGroup>

          <Select value={range} onValueChange={(v) => setRange(v as any)}>
            <SelectTrigger
              className="flex @[767px]/card:hidden w-36 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              aria-label="Pilih rentang"
            >
              <SelectValue placeholder="3 bulan" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3m" className="rounded-lg">
                3 bulan
              </SelectItem>
              <SelectItem value="6m" className="rounded-lg">
                6 bulan
              </SelectItem>
              <SelectItem value="1y" className="rounded-lg">
                1 tahun
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-4 sm:pt-6">
        {error ? (
          <div className="text-sm text-destructive">Gagal memuat chart.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            {/* ================= LINE CHART ================= */}
            <div className="lg:col-span-3">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData}>
                  <defs>
                    {series.map((s) => (
                      <linearGradient
                        key={s.key}
                        id={`fill-${s.key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={`var(--color-${s.key})`}
                          stopOpacity={1}
                        />
                        <stop
                          offset="95%"
                          stopColor={`var(--color-${s.key})`}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tickFormatter={(value) => monthLabel(String(value))}
                  />

                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) =>
                          `Bulan: ${monthLabel(String(value))}`
                        }
                        indicator="dot"
                      />
                    }
                  />

                  {series.map((s) => (
                    <Area
                      key={s.key}
                      dataKey={s.key}
                      type="natural"
                      fill={`url(#fill-${s.key})`}
                      stroke={`var(--color-${s.key})`}
                      stackId={data?.mode === "stacked" ? "a" : undefined}
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
            </div>

            {/* ================= PIE CHART ================= */}
            <div className="lg:col-span-2">
              <BestWitelPieCard range={range} witel={witel} />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-xs text-muted-foreground mt-2">
            Memuat data...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
