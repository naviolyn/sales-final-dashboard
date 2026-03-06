"use client";

import * as React from "react";
import useSWR from "swr";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
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
import { getWitelColor } from "@/lib/witel-colors";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

export function ChartSalesByWitel() {
  const isMobile = useIsMobile();
  const sp = useSearchParams();
  const witel = sp.get("witel") || "ALL";

  const [range, setRange] = React.useState<"3m" | "6m" | "1y">("3m");

  React.useEffect(() => {
    if (isMobile) setRange("3m");
  }, [isMobile]);

  const qs = new URLSearchParams({ range, witel });

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/sales-by-witel?${qs.toString()}`,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const series: Array<{ key: string; label: string }> = data?.series ?? [];
  const chartData: Record<string, unknown>[] = data?.data ?? [];

  const chartConfig = React.useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    series.forEach((s) => {
      cfg[s.key] = { label: s.label, color: getWitelColor(s.label) };
    });
    return cfg;
  }, [series]);

  const rangeLabel =
    range === "3m" ? "3 bulan" : range === "6m" ? "6 bulan" : "1 tahun";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5 min-w-0">
          <CardTitle>Sales per Witel</CardTitle>
          <CardDescription className="truncate">
            {witel !== "ALL" ? `Witel: ${witel}` : "Semua Witel"} · {rangeLabel}{" "}
            terakhir
          </CardDescription>
        </div>

        <CardAction className="shrink-0">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v) => v && setRange(v as typeof range)}
            variant="outline"
            className="hidden md:flex"
          >
            <ToggleGroupItem value="3m" className="px-3 text-xs">
              3 bln
            </ToggleGroupItem>
            <ToggleGroupItem value="6m" className="px-3 text-xs">
              6 bln
            </ToggleGroupItem>
            <ToggleGroupItem value="1y" className="px-3 text-xs">
              1 tahun
            </ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={range}
            onValueChange={(v) => setRange(v as typeof range)}
          >
            <SelectTrigger className="flex w-28 md:hidden" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 bulan</SelectItem>
              <SelectItem value="6m">6 bulan</SelectItem>
              <SelectItem value="1y">1 tahun</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="pb-4 px-3 sm:px-6">
        {error ? (
          <p className="py-8 text-center text-sm text-destructive">
            Gagal memuat chart.
          </p>
        ) : (
          /* Stack vertikal di bawah xl, grid di xl ke atas */
          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-5 xl:gap-6">
            {/* ── Area Chart ── */}
            <div className="w-full xl:col-span-3">
              {isLoading ? (
                <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                  Memuat...
                </div>
              ) : chartData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada data.
                </p>
              ) : (
                <>
                  <ChartContainer
                    config={chartConfig}
                    className="h-[240px] w-full"
                  >
                    <AreaChart
                      data={chartData}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <defs>
                        {series.map((s) => (
                          <linearGradient
                            key={s.key}
                            id={`fill-switel-${s.key}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={getWitelColor(s.label)}
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor={getWitelColor(s.label)}
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                        ))}
                      </defs>

                      <CartesianGrid vertical={false} strokeDasharray="3 3" />

                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => monthLabel(String(v))}
                      />

                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        tickMargin={4}
                        width={36}
                        allowDecimals={false}
                        domain={[0, "auto"]}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                        }
                      />

                      <ChartTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(v) =>
                              `Bulan: ${monthLabel(String(v))}`
                            }
                            indicator="dot"
                          />
                        }
                      />

                      {series.map((s) => (
                        <Area
                          key={s.key}
                          dataKey={s.key}
                          type="monotone"
                          stroke={getWitelColor(s.label)}
                          strokeWidth={2}
                          fill={`url(#fill-switel-${s.key})`}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </AreaChart>
                  </ChartContainer>

                  {/* Legend di luar chart supaya bisa wrap bebas */}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
                    {series.map((s) => (
                      <span
                        key={s.key}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: getWitelColor(s.label) }}
                        />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Pie Chart ── */}
            <div className="w-full xl:col-span-2 xl:flex xl:items-center">
              <BestWitelPieCard range={range} witel={witel} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
