"use client";

import * as React from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AnalyticsFiltersContextValue {
  bulan: string;
  setBulan: (v: string) => void;
  selectedWitels: string[];
  setSelectedWitels: (v: string[]) => void;
  witelParam: string;
}

const AnalyticsFiltersContext =
  React.createContext<AnalyticsFiltersContextValue | null>(null);

export function useAnalyticsFilters() {
  const ctx = React.useContext(AnalyticsFiltersContext);
  if (!ctx)
    throw new Error(
      "useAnalyticsFilters must be used within AnalyticsFiltersProvider"
    );
  return ctx;
}

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function AnalyticsFiltersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bulan, setBulan] = React.useState<string>("");
  const [selectedWitels, setSelectedWitels] = React.useState<string[]>([]);

  const witelParam = React.useMemo(() => {
    if (selectedWitels.length === 0) return "ALL";
    return selectedWitels.join(",");
  }, [selectedWitels]);

  const value = React.useMemo(
    () => ({ bulan, setBulan, selectedWitels, setSelectedWitels, witelParam }),
    [bulan, selectedWitels, witelParam]
  );

  return (
    <AnalyticsFiltersContext.Provider value={value}>
      {children}
    </AnalyticsFiltersContext.Provider>
  );
}

export function AnalyticsFilters() {
  const { data } = useSWR("/api/summary/meta", fetcher);
  const { bulan, setBulan, selectedWitels, setSelectedWitels } =
    useAnalyticsFilters();

  const months: string[] = data?.months ?? [];
  const witels: string[] = data?.witels ?? [];

  // Set default bulan saat pertama load
  React.useEffect(() => {
    if (months.length > 0 && !bulan) {
      const current = getCurrentMonthKey();
      const defaultMonth = months.includes(current)
        ? current
        : months[months.length - 1];
      setBulan(defaultMonth);
    }
  }, [months, bulan, setBulan]);

  const formatMonthLabel = (monthKey: string) => {
    if (!monthKey) return "";
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
  };

  const toggleWitel = (witel: string) => {
    setSelectedWitels((prev) =>
      prev.includes(witel) ? prev.filter((w) => w !== witel) : [...prev, witel]
    );
  };

  const toggleAll = () => {
    setSelectedWitels((prev) =>
      prev.length === witels.length ? [] : [...witels]
    );
  };

  const witelLabel = React.useMemo(() => {
    if (selectedWitels.length === 0) return "Semua Witel";
    if (selectedWitels.length === witels.length) return "Semua Witel";
    if (selectedWitels.length === 1) return selectedWitels[0];
    return `${selectedWitels.length} Witel dipilih`;
  }, [selectedWitels, witels]);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
      {/* Bulan Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Bulan</label>
        <Select value={bulan} onValueChange={setBulan}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pilih Bulan">
              {bulan ? formatMonthLabel(bulan) : "Pilih Bulan"}
            </SelectValue>
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

      {/* Witel Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Witel</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <span className="truncate">{witelLabel}</span>
              <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <div className="max-h-[300px] overflow-y-auto">
              {/* Semua Witel */}
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-accent",
                  selectedWitels.length === witels.length && "bg-accent"
                )}
                onClick={toggleAll}
              >
                <div
                  className={cn(
                    "flex size-4 items-center justify-center rounded-sm border",
                    selectedWitels.length === witels.length
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  )}
                >
                  {selectedWitels.length === witels.length && (
                    <Check className="size-3" />
                  )}
                </div>
                <span className="text-sm font-medium">Semua Witel</span>
              </div>

              <div className="my-1 h-px bg-border" />

              {/* Individual Witels */}
              {witels.map((witel) => (
                <div
                  key={witel}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-accent",
                    selectedWitels.includes(witel) && "bg-accent"
                  )}
                  onClick={() => toggleWitel(witel)}
                >
                  <div
                    className={cn(
                      "flex size-4 items-center justify-center rounded-sm border",
                      selectedWitels.includes(witel)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    )}
                  >
                    {selectedWitels.includes(witel) && (
                      <Check className="size-3" />
                    )}
                  </div>
                  <span className="text-sm">{witel}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Reset Button */}
      {(selectedWitels.length > 0 || bulan) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedWitels([]);
            const current = getCurrentMonthKey();
            const defaultMonth = months.includes(current)
              ? current
              : months[months.length - 1];
            setBulan(defaultMonth);
          }}
          className="mt-auto"
        >
          Reset Filter
        </Button>
      )}
    </div>
  );
}
