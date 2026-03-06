"use client";

import * as React from "react";
import useSWR from "swr";
import { CalendarRange, Check, ChevronsUpDown, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { getWitelColor } from "@/lib/witel-colors";

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
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function formatPeriodLabel(start?: string, end?: string) {
  if (!start) return "-";
  if (!end || start === end) return formatMonthLabel(start);
  return `${formatMonthLabel(start)} – ${formatMonthLabel(end)}`;
}

function labelWitel(selected: string[], all: string[]) {
  if (selected.length === 0 || selected.length === all.length)
    return "Semua Witel";
  if (selected.length === 1) return selected[0];
  return `${selected.length} dipilih`;
}

function WitelBadge({ witel }: { witel: string }) {
  const color = getWitelColor(witel);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        borderColor: color,
        color: color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: color }}
      />
      {witel}
    </span>
  );
}

export const FilterContext = React.createContext<{
  start: string;
  end: string;
  selectedWitels: string[];
  witelParam: string;
}>({ start: "", end: "", selectedWitels: [], witelParam: "ALL" });

export function GlobalFilters({ children }: { children?: React.ReactNode }) {
  const { data, isLoading } = useSWR<SummaryMetaResponse>(
    "/api/summary/meta",
    fetcher
  );

  const months = data?.months ?? [];
  const witels = data?.witel ?? [];

  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");

  React.useEffect(() => {
    if (data?.defaultStart && !start) {
      setStart(data.defaultStart);
      setEnd(data.defaultEnd);
    }
  }, [data, start]);

  React.useEffect(() => {
    if (start && end && start > end) setEnd(start);
  }, [start, end]);

  const [selectedWitels, setSelectedWitels] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (witels.length && selectedWitels.length === 0) setSelectedWitels(witels);
  }, [witels, selectedWitels.length]);

  const toggleWitel = (w: string) => {
    setSelectedWitels((prev) => {
      const next = prev.includes(w)
        ? prev.filter((x) => x !== w)
        : [...prev, w];
      return next.length === 0 ? witels : next;
    });
  };

  const setAllWitels = () => setSelectedWitels(witels);
  const isAllWitels =
    selectedWitels.length === 0 || selectedWitels.length === witels.length;
  const witelParam = isAllWitels ? "ALL" : selectedWitels.join(",");

  const filterValue = React.useMemo(
    () => ({ start, end, selectedWitels, witelParam }),
    [start, end, selectedWitels, witelParam]
  );

  return (
    <FilterContext.Provider value={filterValue}>
      <div className="flex flex-col gap-6">
        {/* ── Header ── */}
        <div className="rounded-xl border bg-card px-6 py-5 shadow-sm">
          {/* Judul + filter controls dalam satu baris di sm+, stack di mobile */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold leading-tight shrink-0">
              Analytics Dashboard
            </h2>

            {/* Filter controls — selalu dalam satu baris, wrap kalau perlu */}
            <div className="flex flex-wrap items-end gap-x-2 gap-y-3">
              {/* Bulan Awal */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Bulan Awal
                </span>
                <Select value={start} onValueChange={setStart}>
                  <SelectTrigger className="w-[155px]">
                    <SelectValue placeholder="Pilih bulan" />
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

              {/* s.d. — sejajar dengan trigger input (h-9 = 36px, label 20px + gap 4px = 24px offset) */}
              <span className="mb-[9px] text-sm text-muted-foreground">
                s.d.
              </span>

              {/* Bulan Akhir */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Bulan Akhir
                </span>
                <Select value={end} onValueChange={setEnd}>
                  <SelectTrigger className="w-[155px]">
                    <SelectValue placeholder="Pilih bulan" />
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

              {/* Witel */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Witel</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[155px] justify-between"
                      disabled={isLoading}
                    >
                      <span className="truncate">
                        {labelWitel(selectedWitels, witels)}
                      </span>
                      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-0">
                    <Command>
                      <CommandInput placeholder="Cari witel..." />
                      <CommandList>
                        <CommandEmpty>Witel tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={setAllWitels}>
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isAllWitels ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Semua Witel
                          </CommandItem>
                          {witels.map((w) => (
                            <CommandItem
                              key={w}
                              onSelect={() => toggleWitel(w)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedWitels.includes(w)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {w}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Baris 2: ringkasan filter aktif */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Menampilkan data untuk:
            </span>
            <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
              <CalendarRange className="size-3 shrink-0" />
              {formatPeriodLabel(start, end)}
            </Badge>
            {isAllWitels ? (
              <Badge
                variant="secondary"
                className="gap-1.5 text-xs font-normal"
              >
                <MapPin className="size-3 shrink-0" />
                Semua Witel
              </Badge>
            ) : (
              selectedWitels.map((w) => <WitelBadge key={w} witel={w} />)
            )}
          </div>
        </div>

        {children}
      </div>
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = React.useContext(FilterContext);
  if (!ctx)
    throw new Error("useFilters must be used within FilterContext.Provider");
  return ctx;
}
