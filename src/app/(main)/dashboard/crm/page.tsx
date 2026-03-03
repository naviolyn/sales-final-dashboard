import { InsightCards } from "./_components/insight-cards";
import { OperationalCards } from "./_components/operational-cards";
import { OverviewCards } from "./_components/overview-cards";
import { TableCards } from "./_components/table-cards";
import { TabsTop } from "./_components/tabs-top";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <TabsTop />
      <OverviewCards />
      <InsightCards />
      <OperationalCards />
      <TableCards />
    </div>
  );
}
