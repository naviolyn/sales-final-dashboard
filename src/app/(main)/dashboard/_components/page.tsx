import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalFilters } from "./_components/global-filters";
import { MetricAnalytics } from "./_components/metric-analytics";

export default function CRMPage() {
  return (
    <GlobalFilters>
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="poi">POI</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <MetricAnalytics metric="sales" />
        </TabsContent>

        <TabsContent value="poi" className="mt-6">
          <MetricAnalytics metric="poi" />
        </TabsContent>

        <TabsContent value="collection" className="mt-6">
          <MetricAnalytics metric="coll" />
        </TabsContent>
      </Tabs>
    </GlobalFilters>
  );
}
