import data from "./_components/data.json";
import { DataTable } from "./_components/data-table";
import TopARCard from "./_components/top-ar";
import { ChartSalesByWitel } from "./_components/chart-sales-by-witel";

// ⬇️ PERBAIKI PATH INI
import { DashboardHeaderAndCards } from "../_components/dashboard-header-and-cards";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <DashboardHeaderAndCards />
      <ChartSalesByWitel />
      <div className="flex flex-row max-lg:flex-col gap-4 md:gap-6 ">
        {/* <div className="xl:w-3/5">
          <TopARCard />
        </div> */}
        {/* <div className="xl:w-2/5">yey</div> */}
      </div>

      <DataTable data={data} />
    </div>
  );
}
