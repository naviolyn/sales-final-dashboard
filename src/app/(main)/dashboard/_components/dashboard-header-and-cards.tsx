"use client";

import * as React from "react";
import useSWR from "swr";
import {
  CalendarRange,
  Check,
  ChevronsUpDown,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { SectionCards } from "../default/_components/section-cards";
import TopARWideCard from "../default/_components/top-ar";
import ProductivityChart from "../default/_components/productivity-chart";

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
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function formatSyncTime(isoString?: string) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardHeaderAndCards() {
  const { data, isLoading } = useSWR<SummaryMetaResponse>(
    "/api/summary/meta",
    fetcher,
    { refreshInterval: 60_000 }
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
    if (start && end && start > end) setEnd(start);
  }, [start, end]);

  const [selectedWitels, setSelectedWitels] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (witels.length && selectedWitels.length === 0) setSelectedWitels(witels);
  }, [witels]);

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

  // Label ringkasan periode
  const periodLabel = React.useMemo(() => {
    if (!start) return "-";
    if (!end || start === end) return formatMonthLabel(start);
    return `${formatMonthLabel(start)} – ${formatMonthLabel(end)}`;
  }, [start, end]);

  // Label witel: semua → teks, sebagian → tampilkan masing-masing
  const isAllWitels =
    selectedWitels.length === 0 || selectedWitels.length === witels.length;



  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Kiri: judul + ringkasan filter aktif */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Overview</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Menampilkan data untuk:
            </span>

            {/* Badge periode */}
            <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
              <CalendarRange className="size-3 shrink-0" />
              {periodLabel}
            </Badge>

            {/* Badge witel: satu badge "Semua Witel" atau badge per witel */}
            {isAllWitels ? (
              <Badge
                variant="secondary"
                className="gap-1.5 text-xs font-normal"
              >
                <MapPin className="size-3 shrink-0" />
                Semua Witel
              </Badge>
            ) : (
              selectedWitels.map((w) => (
                <Badge
                  key={w}
                  variant="secondary"
                  className="gap-1.5 text-xs font-normal"
                >
                  <MapPin className="size-3 shrink-0" />
                  {w}
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Kanan: filter controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-end">
          {/* Filter periode */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Bulan Awal</span>
              <Select value={start} onValueChange={setStart}>
                <SelectTrigger className="w-[160px]">
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
                <SelectTrigger className="w-[160px]">
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

          {/* Filter witel */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-between"
                disabled={isLoading}
              >
                {isAllWitels
                  ? "Semua Witel"
                  : selectedWitels.length === 1
                  ? selectedWitels[0]
                  : `${selectedWitels.length} Witel dipilih`}
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
                          isAllWitels ? "opacity-100" : "opacity-0"
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
      {/* KPI Cards */}
      <SectionCards start={start} end={end} witel={witelParam} />
      {/* Charts: Top AR (1/3) + Produktivitas (2/3) */}
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="w-full lg:w-1/3">
          <TopARWideCard start={start} end={end} witel={witelParam} />
        </div>
        <div className="w-full lg:w-2/3">
          <ProductivityChart start={start} end={end} witel={witelParam} />
        </div>
      </div>
      {/* Last sync */}
      
    </div>
  );
}
