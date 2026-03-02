"use client";

import * as React from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// import { topArChartConfig } from "./config-ar";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

const topArChartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function fmtPeriode(data: any) {
  // API kamu return "months" (array). Tapi biar backward-compatible, cek juga "month"
  if (Array.isArray(data?.months) && data.months.length) return data.months.join(" - ");
  if (typeof data?.month === "string" && data.month) return data.month;
  return "-";
}

export default function TopARWideCard() {
  const sp = useSearchParams();

  const start = sp.get("start") || "";
  const end = sp.get("end") || "";
  const month = sp.get("month") || "";
  const witel = sp.get("witel") || "ALL";

  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    } else if (month) {
      p.set("month", month);
    }
    p.set("witel", witel);
    p.set("topN", "10");
    return p.toString();
  }, [start, end, month, witel]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/top-ar?${qs}`,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const chartData =
    (data?.items ?? []).map((x: any) => ({
      name: x.namaAr,
      sales: Number(x.sales ?? 0),
      witel: x.witel,
    })) ?? [];

  return (
    <Card className="col-span-1 xl:col-span-3">
      <CardHeader>
        <CardTitle>Top 10 AR by Sales</CardTitle>
        <CardDescription>
          Periode: {fmtPeriode(data)}{" "}
          {data?.witel ? `• Witel: ${data.witel}` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="size-full">
        {error ? (
          <div className="text-sm text-destructive">
            Gagal load data Top AR.
          </div>
        ) : (
          <ChartContainer config={topArChartConfig} className="size-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              barSize={32}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis type="number" hide />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, _name, item) => {
                      const payload: any = item?.payload;
                      return [
                        fmtNumber(Number(value)),
                        " ",
                        `Sales • ${payload?.witel ?? ""}`,
                      ];
                    }}
                  />
                }
              />

              {/* NO STACKED: cuma 1 Bar */}
              <Bar
                dataKey="sales"
                layout="vertical"
                fill="var(--color-sales)"
                radius={[6, 6, 6, 6]}
              >
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={8}
                  className="fill-primary-foreground text-xs"
                />
                <LabelList
                  dataKey="sales"
                  position="insideRight"
                  offset={8}
                  className="fill-primary-foreground text-xs tabular-nums"
                  formatter={(v: any) => fmtNumber(Number(v))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-muted-foreground text-xs">
          {isLoading ? "Loading..." : `Total item: ${chartData.length}`}
          {data?.lastSync
            ? ` · Sync: ${new Date(data.lastSync).toLocaleString("id-ID")}`
            : ""}
        </p>
      </CardFooter>
    </Card>
  );
}