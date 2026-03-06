"use client";

import * as React from "react";
import useSWR from "swr";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getWitelColor } from "@/lib/witel-colors";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SortKey =
  | "namaAr"
  | "witel"
  | "telda"
  | "kodeSales"
  | "noHp"
  | "email"
  | "sales"
  | "poi"
  | "coll"
  | "underperform";

function fmtNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function formatMonthLabel(key?: string) {
  if (!key) return "-";
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

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

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [search, setSearch] = React.useState("");
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );
  function toggle(val: string) {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val]
    );
  }
  const displayLabel =
    selected.length === 0
      ? `Semua ${label}`
      : selected.length === 1
      ? selected[0]
      : `${selected.length} ${label} dipilih`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-[160px] justify-between font-normal text-sm"
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[260px] p-0"
        align="start"
        sideOffset={4}
        avoidCollisions
        collisionPadding={16}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={`Cari ${label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
          {search && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearch("");
              }}
            >
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between border-b px-3 py-1.5">
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              onChange(options);
            }}
          >
            Pilih semua
          </button>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              onChange([]);
            }}
          >
            Hapus semua
          </button>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Tidak ditemukan
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle(opt);
                  }}
                >
                  <Checkbox
                    checked={selected.includes(opt)}
                    className="pointer-events-none shrink-0"
                  />
                  <span className="truncate">{opt}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ALL_COLUMNS = [
  { key: "no", label: "#" },
  { key: "kodeSales", label: "Kode Sales" },
  { key: "namaAr", label: "Nama AR" },
  { key: "noHp", label: "No HP" },
  { key: "email", label: "Email" },
  { key: "witel", label: "Witel" },
  { key: "telda", label: "Telda" },
  { key: "sales", label: "Sales" },
  { key: "poi", label: "POI" },
  { key: "coll", label: "Collection" },
  { key: "underperform", label: "Status" },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

export default function ARDataPage() {
  const { data: meta } = useSWR("/api/summary/meta", fetcher);
  const months: string[] = meta?.months ?? [];
  const defaultMonth = meta?.defaultStart ?? "";

  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [selectedWitels, setSelectedWitels] = React.useState<string[]>([]);
  const [selectedTeldas, setSelectedTeldas] = React.useState<string[]>([]);
  const [kodeSalesInput, setKodeSalesInput] = React.useState("");
  const [kodeSales, setKodeSales] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortKey>("sales");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [underperformFilter, setUnderperformFilter] = React.useState<
    "all" | "underperform" | "ok"
  >("all");
  const pageSize = 50;

  const [visibleCols, setVisibleCols] = React.useState<Set<ColumnKey>>(
    new Set(ALL_COLUMNS.map((c) => c.key))
  );

  function toggleCol(key: ColumnKey) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else next.add(key);
      return next;
    });
  }

  React.useEffect(() => {
    if (defaultMonth && !start) {
      setStart(defaultMonth);
      setEnd(defaultMonth);
    }
  }, [defaultMonth]);
  React.useEffect(() => {
    setPage(1);
  }, [
    start,
    end,
    selectedWitels,
    selectedTeldas,
    kodeSales,
    sortBy,
    sortDir,
    underperformFilter,
  ]);
  React.useEffect(() => {
    setSelectedTeldas([]);
  }, [selectedWitels]);

  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    if (selectedWitels.length) p.set("witel", selectedWitels.join(","));
    if (selectedTeldas.length) p.set("telda", selectedTeldas.join(","));
    if (kodeSales) p.set("kodeSales", kodeSales);
    p.set("sortBy", sortBy);
    p.set("sortDir", sortDir);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (underperformFilter !== "all") p.set("underperform", underperformFilter);
    return p.toString();
  }, [
    start,
    end,
    selectedWitels,
    selectedTeldas,
    kodeSales,
    sortBy,
    sortDir,
    page,
    underperformFilter,
  ]);

  const { data, isLoading } = useSWR(
    start ? `/api/dashboard/ar-data?${qs}` : null,
    fetcher,
    { keepPreviousData: true } as any
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const availableWitels: string[] = data?.witels ?? [];
  const availableTeldas: string[] = data?.teldas ?? [];
  const hasFilters =
    selectedWitels.length > 0 ||
    selectedTeldas.length > 0 ||
    kodeSales ||
    underperformFilter !== "all";

  function handleSort(col: SortKey) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  const showCol = (key: ColumnKey) => visibleCols.has(key);

  return (
    <div
      className="flex flex-col gap-3 p-4"
      style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}
    >
      <div>
        <h1 className="text-xl font-semibold">Data AR</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tabel data Account Representative — kontak, performa, dan status
          underperform
          <span className="italic">
            (sales lebih kecil dari 3 selama tiga bulan terakhir)
          </span>
          .
        </p>
      </div>

      {/* FILTER CARD */}
      <Card className="w-full overflow-hidden py-4 gap-2">
        <CardContent className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Bulan Awal
              </label>
              <Select
                value={start}
                onValueChange={(v) => {
                  setStart(v);
                  if (end && v > end) setEnd(v);
                }}
              >
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m} disabled={!!end && m > end}>
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="pb-1.5 text-sm text-muted-foreground">s.d.</span>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Bulan Akhir
              </label>
              <Select
                value={end}
                onValueChange={(v) => {
                  setEnd(v);
                  if (start && v < start) setStart(v);
                }}
              >
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem
                      key={m}
                      value={m}
                      disabled={!!start && m < start}
                    >
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-9 w-px bg-border" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Witel
              </label>
              <MultiSelect
                label="Witel"
                options={availableWitels}
                selected={selectedWitels}
                onChange={setSelectedWitels}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Telda
              </label>
              <MultiSelect
                label="Telda"
                options={availableTeldas}
                selected={selectedTeldas}
                onChange={setSelectedTeldas}
              />
            </div>
            <div className="h-9 w-px bg-border" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Kode / Nama AR
              </label>
              <div className="flex gap-1.5">
                <div className="relative">
                  <Input
                    className="h-9 w-[200px] pr-7 text-sm"
                    placeholder="Cari kode atau nama..."
                    value={kodeSalesInput}
                    onChange={(e) => setKodeSalesInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setKodeSales(kodeSalesInput)
                    }
                  />
                  {kodeSalesInput && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setKodeSalesInput("");
                        setKodeSales("");
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setKodeSales(kodeSalesInput)}
                >
                  <Search className="size-4" />
                </Button>
              </div>
            </div>
            <div className="h-9 w-px bg-border" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <Select
                value={underperformFilter}
                onValueChange={(v) => setUnderperformFilter(v as any)}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="underperform">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-rose-500" />
                      Underperform
                    </span>
                  </SelectItem>
                  <SelectItem value="ok">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Good
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground self-end"
                onClick={() => {
                  setSelectedWitels([]);
                  setSelectedTeldas([]);
                  setKodeSalesInput("");
                  setKodeSales("");
                  setUnderperformFilter("all");
                }}
              >
                <X className="size-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Active filter badges */}
          {(selectedWitels.length > 0 || selectedTeldas.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
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
              {selectedTeldas.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
                >
                  {t}
                  <button
                    className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                    onClick={() =>
                      setSelectedTeldas(selectedTeldas.filter((x) => x !== t))
                    }
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABLE CARD */}
      <Card className="w-full overflow-hidden py-4">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="max-w-full min-w-[400px]">
              <TableHeader>
                <TableRow>
                  {showCol("no") && (
                    <TableHead className="w-12 text-center">#</TableHead>
                  )}
                  {showCol("kodeSales") && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("kodeSales")}
                    >
                      <div className="flex items-center gap-1">
                        Kode Sales{" "}
                        <SortIcon
                          column="kodeSales"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </div>
                    </TableHead>
                  )}
                  {showCol("namaAr") && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("namaAr")}
                    >
                      <div className="flex items-center gap-1">
                        Nama AR{" "}
                        <SortIcon
                          column="namaAr"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </div>
                    </TableHead>
                  )}
                  {showCol("noHp") && (
                    <TableHead className="whitespace-nowrap">No HP</TableHead>
                  )}
                  {showCol("email") && (
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                  )}
                  {showCol("witel") && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
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
                  )}
                  {showCol("telda") && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
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
                  )}
                  {showCol("sales") && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap text-right"
                      onClick={() => handleSort("sales")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Sales{" "}
                        <SortIcon
                          column="sales"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </div>
                    </TableHead>
                  )}
                  {showCol("poi") && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap text-right"
                      onClick={() => handleSort("poi")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        POI{" "}
                        <SortIcon
                          column="poi"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </div>
                    </TableHead>
                  )}
                  {showCol("coll") && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap text-right"
                      onClick={() => handleSort("coll")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Collection{" "}
                        <SortIcon
                          column="coll"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </div>
                    </TableHead>
                  )}
                  {showCol("underperform") && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("underperform")}
                    >
                      <div className="flex items-center gap-1">
                        Status{" "}
                        <SortIcon
                          column="underperform"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: visibleCols.size }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 rounded bg-muted animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleCols.size}
                      className="py-16 text-center text-muted-foreground"
                    >
                      Tidak ada data untuk filter yang dipilih.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row: any, idx: number) => {
                    const witelColor = getWitelColor(row.witel);
                    const isUnderperform = row.underperform === true;
                    return (
                      <TableRow
                        key={`${row.kodeSales}-${idx}`}
                        className={cn(
                          isUnderperform &&
                            "bg-rose-100/60 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30"
                        )}
                      >
                        {showCol("no") && (
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {(page - 1) * pageSize + idx + 1}
                          </TableCell>
                        )}
                        {showCol("kodeSales") && (
                          <TableCell className="font-mono text-sm">
                            {row.kodeSales || "-"}
                          </TableCell>
                        )}
                        {showCol("namaAr") && (
                          <TableCell className="font-medium">
                            {row.namaAr}
                          </TableCell>
                        )}
                        {showCol("noHp") && (
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {row.noHp || "-"}
                          </TableCell>
                        )}
                        {showCol("email") && (
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            <span title={row.email}>{row.email || "-"}</span>
                          </TableCell>
                        )}
                        {showCol("witel") && (
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="gap-1.5 font-normal"
                            >
                              <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: witelColor }}
                              />
                              {row.witel}
                            </Badge>
                          </TableCell>
                        )}
                        {showCol("telda") && (
                          <TableCell className="text-sm text-muted-foreground">
                            {row.telda || "-"}
                          </TableCell>
                        )}
                        {showCol("sales") && (
                          <TableCell className="text-right tabular-nums font-medium">
                            {fmtNumber(row.sales)}
                          </TableCell>
                        )}
                        {showCol("poi") && (
                          <TableCell className="text-right tabular-nums font-medium">
                            {fmtNumber(row.poi)}
                          </TableCell>
                        )}
                        {showCol("coll") && (
                          <TableCell className="text-right tabular-nums font-medium">
                            {fmtNumber(row.coll)}
                          </TableCell>
                        )}
                        {showCol("underperform") && (
                          <TableCell>
                            {isUnderperform ? (
                              <Badge
                                variant="outline"
                                className="gap-1 border-rose-400 bg-rose-100 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400"
                              >
                                <AlertTriangle className="size-3" />
                                Underperform
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="gap-1 border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400"
                              >
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Good
                              </Badge>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {total > 0
                ? `Menampilkan ${(page - 1) * pageSize + 1}–${Math.min(
                    page * pageSize,
                    total
                  )} dari ${fmtNumber(total)} AR`
                : "Tidak ada data"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[60px] text-center text-sm tabular-nums">
                {page} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
