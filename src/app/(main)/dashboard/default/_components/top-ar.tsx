"use client";

import * as React from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "API error");
  return json;
};

const topArChartConfig = {
  sales: {
    label: "Sales",
    // Shadcn chart biasanya pakai hsl(var(--chart-1)), sesuaikan kalau kamu punya token lain
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function TopARCard() {
  const sp = useSearchParams();
  const month = sp.get("month") || ""; // dari filter dashboard kamu
  const witel = sp.get("witel") || "ALL"; // dari filter dashboard kamu

  const qs = new URLSearchParams();
  if (month) qs.set("month", month);
  if (witel) qs.set("witel", witel);
  qs.set("topN", "10");

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/top-ar?${qs.toString()}`,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const chartData =
    (data?.items ?? []).map((x: any) => ({
      name: x.namaAr,
      sales: x.sales,
      witel: x.witel,
    })) ?? [];

  return (
    <Card className="@container/card">
      <CardHeader className="pb-2">
        <CardTitle>Top 10 AR by Sales</CardTitle>
        <CardDescription>
          {data?.month ? `Periode: ${data.month}` : "Periode: -"}{" "}
          {data?.witel ? `• Witel: ${data.witel}` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {error ? (
          <div className="text-sm text-destructive">
            Gagal load data Top AR.
          </div>
        ) : (
          <ChartContainer
            className="h-[280px] w-full"
            config={topArChartConfig}
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              barSize={10}
              margin={{ top: 8, right: 12, bottom: 8, left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={140}
              />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `AR: ${label}`}
                    formatter={(value, name, item) => {
                      const payload: any = item?.payload;
                      return [
                        fmtNumber(Number(value)),
                        `Sales • ${payload?.witel ?? ""}`,
                      ];
                    }}
                  />
                }
              />

              <Bar
                dataKey="sales"
                fill="var(--color-sales)" // dari config key "sales"
                radius={[4, 4, 4, 4]}
                background={{
                  fill: "var(--color-background)",
                  radius: 4,
                  opacity: 0.07,
                }}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <span className="font-semibold text-base tabular-nums">
          {isLoading ? "..." : `Total: ${fmtNumber(data?.totalSales ?? 0)}`}
        </span>
        <span className="text-xs text-muted-foreground">
          {data?.lastSync
            ? `Sync: ${new Date(data.lastSync).toLocaleString("id-ID")}`
            : ""}
        </span>
      </CardFooter>
    </Card>
  );
}
