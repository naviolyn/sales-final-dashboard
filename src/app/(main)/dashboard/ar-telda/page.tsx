"use client";

import * as React from "react";
import useSWR from "swr";
import {
  ChevronsUpDown,
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWitelColor } from "@/lib/witel-colors";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const QUOTA_PER_TELDA = 2;

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

type SortKey = "telda" | "witel" | "arCount" | "status";

function SortIcon({
  column,
  sortBy,
  sortDir,
}: {
  column: SortKey;
  sortBy: SortKey;
  sortDir: "asc" | "desc";
}) {
  if (sortBy !== column)
    return <ChevronsUpDown className="size-3 opacity-40" />;
  return sortDir === "asc" ? (
    <ChevronUp className="size-3" />
  ) : (
    <ChevronDown className="size-3" />
  );
}

function getStatus(arCount: number): -1 | 0 | 1 {
  if (arCount < QUOTA_PER_TELDA) return -1;
  if (arCount > QUOTA_PER_TELDA) return 1;
  return 0;
}

export default function ARTeldaPage() {
  const { data: meta } = useSWR("/api/summary/meta", fetcher);
  const defaultMonth = meta?.defaultStart ?? "";

  const [sortBy, setSortBy] = React.useState<SortKey>("telda");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [selectedWitels, setSelectedWitels] = React.useState<string[]>([]);

  const { data, isLoading } = useSWR(
    defaultMonth
      ? `/api/dashboard/ar-data?start=${defaultMonth}&end=${defaultMonth}&pageSize=1000`
      : null,
    fetcher,
    { keepPreviousData: true } as any
  );

  const rawTeldaStats: {
    telda: string;
    arCount: number;
    kurang: boolean;
    witel?: string;
  }[] = data?.teldaStats ?? [];
  const items: any[] = data?.items ?? [];

  const teldaWitelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.telda && item.witel && !map.has(item.telda))
        map.set(item.telda, item.witel);
    }
    return map;
  }, [items]);

  const teldaStats = React.useMemo(
    () =>
      rawTeldaStats.map((t) => ({
        ...t,
        witel: t.witel ?? teldaWitelMap.get(t.telda) ?? "-",
        status: getStatus(t.arCount),
      })),
    [rawTeldaStats, teldaWitelMap]
  );

  const availableWitels = React.useMemo(
    () =>
      [
        ...new Set(
          teldaStats.map((t) => t.witel).filter((w) => w && w !== "-")
        ),
      ].sort(),
    [teldaStats]
  );

  const filtered = React.useMemo(
    () =>
      selectedWitels.length === 0
        ? teldaStats
        : teldaStats.filter((t) => selectedWitels.includes(t.witel)),
    [teldaStats, selectedWitels]
  );

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: any = sortBy === "status" ? a.status : (a as any)[sortBy];
      let bv: any = sortBy === "status" ? b.status : (b as any)[sortBy];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir]);

  function handleSort(col: SortKey) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir(col === "arCount" || col === "status" ? "desc" : "asc");
    }
  }

  const kurangCount = filtered.filter((t) => t.status === -1).length;
  const cukupCount = filtered.filter((t) => t.status === 0).length;
  const lebihCount = filtered.filter((t) => t.status === 1).length;
  const totalTelda = filtered.length;
  const totalAR = filtered.reduce((s, t) => s + t.arCount, 0);

  const witelLabel =
    selectedWitels.length === 0
      ? "Semua Witel"
      : selectedWitels.length === 1
      ? selectedWitels[0]
      : `${selectedWitels.length} Witel dipilih`;

  return (
    <div
      className="flex flex-col gap-3 p-4"
      style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}
    >
      <div>
        <h1 className="text-xl font-semibold">Jumlah AR per Telda</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Monitoring kuota AR di setiap Telda · Kuota: {QUOTA_PER_TELDA} AR per
          Telda
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardDescription>Total Telda</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {fmtNumber(totalTelda)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total AR</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {fmtNumber(totalAR)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Telda Cukup</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {fmtNumber(cukupCount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Telda Kurang AR</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {fmtNumber(kurangCount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Telda Kelebihan AR</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {fmtNumber(lebihCount)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* TABLE CARD */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Detail per Telda</CardTitle>
              <CardDescription>
                {totalTelda} telda · {kurangCount} kurang · {lebihCount}{" "}
                kelebihan
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-sm font-normal shrink-0"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      selectedWitels.length === 0
                        ? "bg-muted-foreground/40"
                        : "bg-primary"
                    )}
                  />
                  {witelLabel}
                  <ChevronsUpDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Filter Witel
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableWitels.map((w) => (
                  <DropdownMenuCheckboxItem
                    key={w}
                    checked={selectedWitels.includes(w)}
                    onCheckedChange={() =>
                      setSelectedWitels((p) =>
                        p.includes(w) ? p.filter((x) => x !== w) : [...p, w]
                      )
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: getWitelColor(w) }}
                      />
                      {w}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedWitels.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <button
                      className="w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground text-left"
                      onClick={() => setSelectedWitels([])}
                    >
                      Reset filter
                    </button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Active filter badges */}
        {selectedWitels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-1 pb-2">
            {selectedWitels.map((w) => (
              <Badge
                key={w}
                variant="secondary"
                className="gap-1.5 pl-2 pr-1 py-0.5 text-xs font-normal"
              >
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: getWitelColor(w) }}
                />
                {w}
                <button
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  onClick={() =>
                    setSelectedWitels(selectedWitels.filter((x) => x !== w))
                  }
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}
            <button
              className="text-xs text-muted-foreground hover:text-foreground px-1"
              onClick={() => setSelectedWitels([])}
            >
              Reset
            </button>
          </div>
        )}

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-[750px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("witel")}
                  >
                    <div className="flex items-center gap-1">
                      Witel{" "}
                      <SortIcon
                        column="witel"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("telda")}
                  >
                    <div className="flex items-center gap-1">
                      Telda{" "}
                      <SortIcon
                        column="telda"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("arCount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Jumlah AR{" "}
                      <SortIcon
                        column="arCount"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Kuota</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status{" "}
                      <SortIcon
                        column="status"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 rounded bg-muted animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-16 text-center text-muted-foreground"
                    >
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((t, idx) => (
                    <TableRow
                      key={t.telda}
                      className={cn(
                        t.status === -1 &&
                          "bg-rose-100/60 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30",
                        t.status === 1 &&
                          "bg-orange-100/60 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30"
                      )}
                    >
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="gap-1.5 font-normal"
                        >
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: getWitelColor(t.witel) }}
                          />
                          {t.witel || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {t.telda || "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {fmtNumber(t.arCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {QUOTA_PER_TELDA}
                      </TableCell>
                      <TableCell>
                        {t.status === -1 && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-rose-400 bg-rose-100 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400"
                          >
                            <AlertTriangle className="size-3" />
                            Kurang {QUOTA_PER_TELDA - t.arCount} AR
                          </Badge>
                        )}
                        {t.status === 0 && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400"
                          >
                            <CheckCircle2 className="size-3" />
                            Cukup
                          </Badge>
                        )}
                        {t.status === 1 && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-orange-400 bg-orange-100 text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-400"
                          >
                            <TrendingUp className="size-3" />
                            Lebih {t.arCount - QUOTA_PER_TELDA} AR
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
