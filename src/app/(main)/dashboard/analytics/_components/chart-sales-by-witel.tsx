"use client";

import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ChartSalesByWitel({
  start,
  end,
  witel,
}: {
  start: string;
  end: string;
  witel: string;
}) {
  const { data } = useSWR(
    `/api/sales-by-witel?start=${start}&end=${end}&witel=${witel}`,
    fetcher
  );

  const chartData = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales per Witel</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="witel" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
