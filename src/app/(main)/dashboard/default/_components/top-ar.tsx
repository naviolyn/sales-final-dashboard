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
  type ChartConfig,
} from "@/components/ui/chart";

import {
  Card,
  CardContent,
  CardFooter,
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

const topArChartConfig = {
  sales: { label: "Sales", color: "var(--chart-2)" },
} satisfies ChartConfig;

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function shortName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const witelColor = getWitelColor(d.witel);

  return (
    <div className="rounded-lg border bg-background px-3 py-2.5 shadow-md text-sm space-y-1.5">
      <p className="font-semibold text-foreground">{d.fullName}</p>
      {d.kodeSales && (
        <p className="text-muted-foreground">
          Kode AR:{" "}
          <span className="font-medium text-foreground">{d.kodeSales}</span>
        </p>
      )}
      <p className="flex items-center gap-1.5 text-muted-foreground">
        Witel:
        <span
          className="size-2.5 rounded-full inline-block"
          style={{ background: witelColor }}
        />
        <span className="font-medium text-foreground">{d.witel}</span>
      </p>
      <p className="text-muted-foreground">
        Sales:{" "}
        <span className="font-medium text-foreground tabular-nums">
          {fmtNumber(d.sales)}
        </span>
      </p>
    </div>
  );
}

export default function TopARWideCard({
  start,
  end,
  witel,
}: {
  start?: string;
  end?: string;
  witel?: string;
}) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    }
    p.set("witel", witel && witel !== "ALL" ? witel : "ALL");
    p.set("topN", "5");
    return p.toString();
  }, [start, end, witel]);

  const { data, isLoading, error } = useSWR(
    `/api/dashboard/top-ar?${qs}`,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const chartData = (data?.items ?? []).map((x: any) => ({
    shortName: shortName(x.namaAr),
    fullName: x.namaAr,
    kodeSales: x.kodeSales,
    sales: Number(x.sales ?? 0),
    witel: x.witel,
  }));

  const BAR_HEIGHT = 44;
  const chartHeight = chartData.length * (BAR_HEIGHT + 20) + 24;

  return (
    <Card className="col-span-1 xl:col-span-3 h-full">
      <CardHeader>
        <CardTitle>Top 5 AR by Sales</CardTitle>
      </CardHeader>

      <CardContent className="px-2">
        {error ? (
          <div className="text-sm text-destructive">
            Gagal load data Top AR.
          </div>
        ) : isLoading ? (
          <div className="space-y-3 px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        ) : (
          <ChartContainer
            config={topArChartConfig}
            style={{ height: chartHeight, width: "100%" }}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={BAR_HEIGHT}
              barCategoryGap={20}
              margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="shortName"
                type="category"
                tickLine={false}
                axisLine={false}
                hide
              />
              <XAxis type="number" hide />

              <ChartTooltip cursor={false} content={<CustomTooltip />} />

              <Bar
                dataKey="sales"
                layout="vertical"
                fill="var(--color-sales)"
                radius={[6, 6, 6, 6]}
              >
                {/* Nama AR — font lebih besar */}
                <LabelList
                  dataKey="shortName"
                  position="insideLeft"
                  offset={14}
                  className="fill-primary-foreground"
                  style={{ fontSize: 14, fontWeight: 500 }}
                />
                {/* Angka sales — font lebih besar */}
                <LabelList
                  dataKey="sales"
                  position="insideRight"
                  offset={14}
                  className="fill-primary-foreground tabular-nums"
                  style={{ fontSize: 14, fontWeight: 600 }}
                  formatter={(v: any) => fmtNumber(Number(v))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>

      {/* <CardFooter>
        <p className="text-muted-foreground text-xs">
          {isLoading ? "Loading..." : `Total item: ${chartData.length}`}
          {data?.lastSync
            ? ` · Sync: ${new Date(data.lastSync).toLocaleString("id-ID")}`
            : ""}
        </p>
      </CardFooter> */}
    </Card>
  );
}
