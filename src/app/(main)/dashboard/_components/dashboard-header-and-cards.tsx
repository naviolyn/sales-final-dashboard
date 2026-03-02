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
import { cn } from "@/lib/utils";

import { SectionCards } from "../default/_components/section-cards";

type SummaryMetaResponse = {
  months: string[]; // ["November","Desember",...]
  witel: string[]; // ["ACEH","SUMUT",...]
  lastSync?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function labelWitel(selected: string[], all: string[]) {
  if (selected.length === 0 || selected.length === all.length)
    return "Semua Witel";
  if (selected.length === 1) return selected[0];
  return `${selected.length} witel dipilih`;
}

export function DashboardHeaderAndCards() {
  const { data, isLoading } = useSWR<SummaryMetaResponse>(
    "/api/summary/meta",
    fetcher
  );

  const months = data?.months ?? [];
  const witel = data?.witel ?? [];

  // default bulan: yang terakhir
  const defaultMonth = months.length ? months[months.length - 1] : "";
  const [month, setMonth] = React.useState<string>("");

  React.useEffect(() => {
    if (!month && defaultMonth) setMonth(defaultMonth);
  }, [defaultMonth, month]);

  // default witel: semua
  const [selectedWitel, setSelectedWitel] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (witel.length && selectedWitel.length === 0) {
      setSelectedWitel(witel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [witel.join("|")]);

  const toggleWitel = (w: string) => {
    setSelectedWitel((prev) => {
      const has = prev.includes(w);
      const next = has ? prev.filter((x) => x !== w) : [...prev, w];
      return next.length === 0 ? witel : next; // kalau kosong, balik ke semua
    });
  };

  const setAllWitel = () => setSelectedWitel(witel);

  // ✅ string yang dipakai API summary
  const witelParam =
    selectedWitel.length === witel.length ? "ALL" : selectedWitel.join(",");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {/* Filter Bulan (nama sheet) */}
          <Select
            value={month}
            onValueChange={setMonth}
            disabled={isLoading || months.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Pilih bulan" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Witel (multi) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between sm:w-[220px]"
                disabled={isLoading}
              >
                {labelWitel(selectedWitel, witel)}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[260px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Cari witel..." />
                <CommandList>
                  <CommandEmpty>Witel tidak ditemukan.</CommandEmpty>

                  <CommandGroup>
                    <CommandItem onSelect={setAllWitel} value="__all__">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedWitel.length === witel.length
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      Semua Witel
                    </CommandItem>

                    {witel.map((w) => {
                      const checked = selectedWitel.includes(w);
                      return (
                        <CommandItem
                          key={w}
                          onSelect={() => toggleWitel(w)}
                          value={w}
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

      {/* ✅ KPI cards */}
      <SectionCards month={month} witel={witelParam} />
    </div>
  );
}
