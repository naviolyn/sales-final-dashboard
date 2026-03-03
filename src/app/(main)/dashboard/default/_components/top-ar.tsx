"use client";

import * as React from "react";
import useSWR from "swr";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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
  sales: { label: "Sales", color: "var(--chart-2)" },
} satisfies ChartConfig;

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

function formatRangeLabel(start?: string, end?: string) {
  if (!start) return "-";
  if (!end || start === end) return formatMonthLabel(start);
  return `${formatMonthLabel(start)} – ${formatMonthLabel(end)}`;
}

export default function TopARWideCard({
  start,
  end,
  witel,
}: {
  start?: string;
  end?: string;
  witel?: string; // "ALL" or "Aceh,Sumut" (kalau mau multi)
}) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    }
    if (witel && witel !== "ALL") p.set("witel", witel);
    else p.set("witel", "ALL");
    p.set("topN", "5");
    return p.toString();
  }, [start, end, witel]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/top-ar?${qs}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    }
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
        <CardTitle>Top 5 AR by Sales</CardTitle>
        <CardDescription>
          Periode: {formatRangeLabel(start, end)}{" "}
          {witel && witel !== "ALL" ? `• Witel: ${witel}` : "• Semua Witel"}
        </CardDescription>
      </CardHeader>

      <CardContent className="size-full h-64">
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
              barSize={36}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
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
                  className="fill-primary-foreground text-base"
                />
                <LabelList
                  dataKey="sales"
                  position="insideRight"
                  offset={8}
                  className="fill-primary-foreground text-base tabular-nums"
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
