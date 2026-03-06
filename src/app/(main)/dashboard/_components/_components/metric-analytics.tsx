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

   // Tunggu sampai filter siap
   if (!start || !end) return null;

   const metricLabel = {
     sales: "Sales",
     poi: "POI",
     coll: "Collection",
   }[metric];


  return (
    <div className="grid gap-6">
      {/* Row 1: Top AR & Bottom AR */}
      <div className="grid gap-6 md:grid-cols-2">
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

      {/* Row 2: Productivity & Witel Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProductivityCard
          metric={metric}
          metricLabel={metricLabel}
          start={start}
          end={end}
          witel={witelParam}
        />
        <WitelDistribution
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
