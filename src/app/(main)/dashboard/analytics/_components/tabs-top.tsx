"use client";

import * as React from "react";
import useSWR from "swr";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
// import { BestWitelPieCard } from "./best-witel-pie-chart";


type SummaryMetaResponse = {
  months: string[];
  witel: string[];
  defaultStart: string;
  defaultEnd: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatMonthLabel(key?: string) {
  if (!key) return "-";

  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;

  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function labelWitel(selected: string[], all: string[]) {
  if (selected.length === 0 || selected.length === all.length)
    return "Semua Witel";
  if (selected.length === 1) return selected[0];
  return `${selected.length} dipilih`;
}

export function TabsTop() {
  const { data, isLoading } = useSWR<SummaryMetaResponse>(
    "/api/summary/meta",
    fetcher
  );

  const months = data?.months ?? [];
  const witels = data?.witel ?? [];

  const [start, setStart] = React.useState<string>("");
  const [end, setEnd] = React.useState<string>("");
  const [selectedWitels, setSelectedWitels] = React.useState<string[]>([]);

  // set default range
  React.useEffect(() => {
    if (data?.defaultStart) {
      setStart(data.defaultStart);
      setEnd(data.defaultEnd);
    }
  }, [data]);

  // ensure start <= end
  React.useEffect(() => {
    if (start && end && start > end) {
      setEnd(start);
    }
  }, [start, end]);

  // default all witels selected
  React.useEffect(() => {
    if (witels.length) {
      setSelectedWitels(witels);
    }
  }, [witels]);

  const toggleWitel = (w: string) => {
    setSelectedWitels((prev) => {
      const has = prev.includes(w);
      const next = has ? prev.filter((x) => x !== w) : [...prev, w];
      return next.length === 0 ? witels : next;
    });
  };

  const setAllWitels = () => setSelectedWitels(witels);

  return (
    <Tabs defaultValue="sales" className="w-full flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="ar">AR</TabsTrigger>
          <TabsTrigger value="poi">POI</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap gap-4 items-end">
          {/* FILTER PERIODE */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Bulan Awal</span>
              <Select value={start} onValueChange={setStart}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Pilih bulan awal" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pb-2 text-sm text-muted-foreground">s.d.</div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Bulan Akhir</span>
              <Select value={end} onValueChange={setEnd}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Pilih bulan akhir" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* WITEL MULTI SELECT */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-between"
                disabled={isLoading}
              >
                {labelWitel(selectedWitels, witels)}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Cari witel..." />
                <CommandList>
                  <CommandEmpty>Witel tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={setAllWitels}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedWitels.length === witels.length
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      Semua Witel
                    </CommandItem>

                    {witels.map((w) => {
                      const checked = selectedWitels.includes(w);
                      return (
                        <CommandItem key={w} onSelect={() => toggleWitel(w)}>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              checked ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {w}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <TabsContent value="sales">
        <div className="rounded-lg border p-6 h-[400px] flex items-center justify-center text-muted-foreground">
          {/* <BestWitelPieCard start={start} end={end} witels={selectedWitels} /> */}
        </div>
      </TabsContent>

      <TabsContent value="ar">
        <div className="rounded-lg border p-6 h-[400px] flex items-center justify-center text-muted-foreground">
          Chart AR Here
        </div>
      </TabsContent>

      <TabsContent value="poi">
        <div className="rounded-lg border p-6 h-[400px] flex items-center justify-center text-muted-foreground">
          Chart POI Here
        </div>
      </TabsContent>
    </Tabs>
  );
}
