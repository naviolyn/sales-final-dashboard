"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AnalyticsFiltersProvider,
  AnalyticsFilters,
  useAnalyticsFilters,
} from "./_components/analytics-filters";
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
} from "@/components/ui/chart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

const chartConfigs = {
  sales: { value: { label: "Sales", color: "var(--chart-1)" } },
  poi: { value: { label: "POI", color: "var(--chart-2)" } },
  coll: { value: { label: "Collection", color: "var(--chart-3)" } },
};

function MetricChart({ metric, title, desc }: any) {
  const { bulan, witelParam } = useAnalyticsFilters();
  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (bulan) p.set("month", bulan);
    if (witelParam && witelParam !== "ALL") p.set("witel", witelParam);
    else p.set("witel", "ALL");
    p.set("topN", "10");
    if (metric !== "sales") p.set("metric", metric);
    return p.toString();
  }, [bulan, witelParam, metric]);

  const { data, isLoading, error } = useSWR(
    bulan ? `/api/dashboard/top-ar?${qs}` : null,
    fetcher
  );
  const chartData = (data?.items ?? []).map((x: any) => ({
    name: x.namaAr,
    value: Number(x[metric] ?? 0),
    witel: x.witel,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-destructive">Gagal memuat data</div>
        ) : isLoading || !bulan ? (
          <div className="text-sm text-muted-foreground">Memuat...</div>
        ) : chartData.length === 0 ? (
          <div className="text-sm text-muted-foreground">Tidak ada data</div>
        ) : (
          <ChartContainer
            config={chartConfigs[metric as keyof typeof chartConfigs]}
            className="h-[400px] w-full"
          >
            <BarChart data={chartData} layout="vertical" barSize={28}>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="name" type="category" hide />
              <XAxis type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(v, _, i) => [
                      fmtNumber(Number(v)),
                      `${metric.toUpperCase()} • ${
                        (i?.payload as any)?.witel ?? ""
                      }`,
                    ]}
                  />
                }
              />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[6, 6, 6, 6]}
              >
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={8}
                  className="fill-primary-foreground text-xs"
                />
                <LabelList
                  dataKey="value"
                  position="insideRight"
                  offset={8}
                  className="fill-primary-foreground text-xs"
                  formatter={(v: any) => fmtNumber(Number(v))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsPageContent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Performance metrics per AR</p>
      </div>
      <AnalyticsFilters />
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricChart
          metric="sales"
          title="Top 10 AR - Sales"
          desc="AR dengan sales tertinggi"
        />
        <MetricChart
          metric="poi"
          title="Top 10 AR - POI"
          desc="AR dengan POI tertinggi"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricChart
          metric="coll"
          title="Top 10 AR - Collection"
          desc="AR dengan collection tertinggi"
        />
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Total metrics overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Filter by month and witel to see detailed analytics
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AnalyticsFiltersProvider>
      <AnalyticsPageContent />
    </AnalyticsFiltersProvider>
  );
}
