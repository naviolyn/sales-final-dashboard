"use client";

import { TopARCard } from "./cards/top-ar-card";
import { BottomARList } from "./cards/bottom-ar-list";
import { ProductivityCard } from "./cards/productivity-card";
import { WitelDistribution } from "./cards/witel-distribution";
import { useFilters } from "./global-filters";

type MetricType = "sales" | "poi" | "coll";

interface MetricAnalyticsProps {
  metric: MetricType;
}

export function MetricAnalytics({ metric }: MetricAnalyticsProps) {
  const { start, end, witelParam } = useFilters();

  if (!start || !end) return null;

  const metricLabel = {
    sales: "Sales",
    poi: "POI",
    coll: "Collection",
  }[metric];

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Productivity (lebih lebar) + Witel Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Productivity: 3/5 di lg, full di mobile */}
        <div className="lg:col-span-3">
          <ProductivityCard
            metric={metric}
            metricLabel={metricLabel}
            start={start}
            end={end}
            witel={witelParam}
          />
        </div>
        {/* Witel Distribution: 2/5 di lg, full di mobile */}
        <div className="lg:col-span-2">
          <WitelDistribution
            metric={metric}
            metricLabel={metricLabel}
            start={start}
            end={end}
            witel={witelParam}
          />
        </div>
      </div>

      {/* Row 2: Top AR + Bottom AR — 50:50 di md+, stack di mobile */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TopARCard
          metric={metric}
          metricLabel={metricLabel}
          start={start}
          end={end}
          witel={witelParam}
        />
        <BottomARList
          metric={metric}
          metricLabel={metricLabel}
          start={start}
          end={end}
          witel={witelParam}
        />
      </div>
    </div>
  );
}
