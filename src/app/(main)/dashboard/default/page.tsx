import { RefreshCw } from "lucide-react";

import data from "./_components/data.json";
import { DataTable } from "./_components/data-table";
import { ChartSalesByWitel } from "./_components/chart-sales-by-witel";
import { DashboardHeaderAndCards } from "../_components/dashboard-header-and-cards";

async function getLastSync(): Promise<string | null> {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
      }/api/summary/meta`,
      { next: { revalidate: 60 } }
    );
    const json = await res.json();
    return json?.lastSync ?? null;
  } catch {
    return null;
  }
}

function formatSyncTime(isoString?: string | null) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const lastSync = await getLastSync();
  const syncLabel = formatSyncTime(lastSync);

  return (
    <div className="@container/main flex flex-col gap-6 pb-6">
      <DashboardHeaderAndCards />
      <ChartSalesByWitel />
      

      {/* Last sync */}
      {syncLabel && (
        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground pb-2">
          <RefreshCw className="size-3" />
          <span>
            Data terakhir diperbarui:{" "}
            <span className="font-medium">{syncLabel}</span>
          </span>
        </div>
      )}
    </div>
  );
}
