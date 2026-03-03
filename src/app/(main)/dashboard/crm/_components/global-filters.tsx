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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

export const FilterContext = React.createContext<{
  start: string;
  end: string;
  selectedWitels: string[];
  witelParam: string;
}>({
  start: "",
  end: "",
  selectedWitels: [],
  witelParam: "ALL",
});

export function GlobalFilters() {
  const { data, isLoading } = useSWR<SummaryMetaResponse>(
    "/api/summary/meta",
    fetcher
  );

  const months = data?.months ?? [];
  const witels = data?.witel ?? [];

  const [start, setStart] = React.useState<string>("");
  const [end, setEnd] = React.useState<string>("");

  React.useEffect(() => {
    if (data?.defaultStart && !start) {
      setStart(data.defaultStart);
      setEnd(data.defaultEnd);
    }
  }, [data, start]);

  React.useEffect(() => {
    if (start && end && start > end) {
      setEnd(start);
    }
  }, [start, end]);

  const [selectedWitels, setSelectedWitels] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (witels.length && selectedWitels.length === 0) {
      setSelectedWitels(witels);
    }
  }, [witels, selectedWitels.length]);

  const toggleWitel = (w: string) => {
    setSelectedWitels((prev) => {
      const has = prev.includes(w);
      const next = has ? prev.filter((x) => x !== w) : [...prev, w];
      return next.length === 0 ? witels : next;
    });
  };

  const setAllWitels = () => setSelectedWitels(witels);

  const witelParam =
    selectedWitels.length === witels.length ? "ALL" : selectedWitels.join(",");

  const filterValue = React.useMemo(
    () => ({ start, end, selectedWitels, witelParam }),
    [start, end, selectedWitels, witelParam]
  );

  return (
    <FilterContext.Provider value={filterValue}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Analytics Dashboard</CardTitle>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Bulan Awal
                  </span>
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
                  <span className="text-xs text-muted-foreground">
                    Bulan Akhir
                  </span>
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
                            <CommandItem
                              key={w}
                              onSelect={() => toggleWitel(w)}
                            >
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
        </CardHeader>
      </Card>
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = React.useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterContext.Provider");
  }
  return context;
}
