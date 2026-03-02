"use client";

import * as React from "react";
import useSWR from "swr";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { SectionCards } from "../default/_components/section-cards";

type SummaryMetaResponse = {
  months: string[];       // ["2025-11","2025-12","2026-01",...]
  witel: string[];        // ["Aceh","Sumut",...]
  defaultMonth?: string;  // optional dari meta endpoint
  lastSync?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function labelMulti(selected: string[], all: string[], allLabel: string) {
  if (selected.length === 0 || selected.length === all.length) return allLabel;
  if (selected.length === 1) return selected[0];
  return `${selected.length} dipilih`;
}

export function DashboardHeaderAndCards() {
  const { data, isLoading } = useSWR<SummaryMetaResponse>("/api/summary/meta", fetcher);

  const months = data?.months ?? [];
  const witels = data?.witel ?? [];

  // ===== default months: bulan saat ini (dari API) atau last =====
  const defaultMonth = data?.defaultMonth || (months.length ? months[months.length - 1] : "");
  const [selectedMonths, setSelectedMonths] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (months.length && selectedMonths.length === 0 && defaultMonth) {
      setSelectedMonths([defaultMonth]); // default 1 bulan (bulan saat ini)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months.join("|"), defaultMonth]);

  const toggleMonth = (m: string) => {
    setSelectedMonths((prev) => {
      const has = prev.includes(m);
      const next = has ? prev.filter((x) => x !== m) : [...prev, m];
      // kalau user kosongin semua, balik ke default 1 bulan
      if (next.length === 0) return defaultMonth ? [defaultMonth] : prev;
      // sort biar rapi
      return next.slice().sort((a, b) => a.localeCompare(b));
    });
  };

  const setAllMonths = () => setSelectedMonths(months);

  // ===== default witel: semua =====
  const [selectedWitels, setSelectedWitels] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (witels.length && selectedWitels.length === 0) {
      setSelectedWitels(witels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [witels.join("|")]);

  const toggleWitel = (w: string) => {
    setSelectedWitels((prev) => {
      const has = prev.includes(w);
      const next = has ? prev.filter((x) => x !== w) : [...prev, w];
      return next.length === 0 ? witels : next; // kalau kosong, balik ke semua
    });
  };

  const setAllWitels = () => setSelectedWitels(witels);

  // ✅ string yg dipakai API summary
  const witelParam = selectedWitels.length === witels.length ? "ALL" : selectedWitels.join(",");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {/* ===== Filter Bulan (multi) ===== */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between sm:w-[220px]"
                disabled={isLoading || months.length === 0}
              >
                {labelMulti(selectedMonths, months, "Semua Bulan")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[280px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Cari bulan (YYYY-MM)..." />
                <CommandList>
                  <CommandEmpty>Bulan tidak ditemukan.</CommandEmpty>

                  <CommandGroup>
                    <CommandItem onSelect={setAllMonths} value="__all_months__">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedMonths.length === months.length ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Semua Bulan
                    </CommandItem>

                    {months.map((m) => {
                      const checked = selectedMonths.includes(m);
                      return (
                        <CommandItem key={m} onSelect={() => toggleMonth(m)} value={m}>
                          <Check className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")} />
                          {m}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* ===== Filter Witel (multi) ===== */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between sm:w-[220px]"
                disabled={isLoading}
              >
                {labelMulti(selectedWitels, witels, "Semua Witel")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[260px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Cari witel..." />
                <CommandList>
                  <CommandEmpty>Witel tidak ditemukan.</CommandEmpty>

                  <CommandGroup>
                    <CommandItem onSelect={setAllWitels} value="__all_witels__">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedWitels.length === witels.length ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Semua Witel
                    </CommandItem>

                    {witels.map((w) => {
                      const checked = selectedWitels.includes(w);
                      return (
                        <CommandItem key={w} onSelect={() => toggleWitel(w)} value={w}>
                          <Check className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")} />
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

      {/* ✅ KPI cards */}
      <SectionCards months={selectedMonths} witel={witelParam} />
    </div>
  );
}