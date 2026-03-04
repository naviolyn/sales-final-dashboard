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

const fetcher = (url: string) => fetch(url).then((r) => r.json());
type SortKey =
  | "namaAr"
  | "witel"
  | "telda"
  | "kodeSales"
  | "sales"
  | "poi"
  | "coll";

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

// ── Multi-select ──────────────────────────────────────────────────────────────
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
        avoidCollisions={true}
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

// ── Warna witel ───────────────────────────────────────────────────────────────
const PALETTE = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
];

function useWitelColors(witels: string[]) {
  return React.useMemo(() => {
    const sorted = [...witels].sort((a, b) => a.localeCompare(b));
    const map = new Map<string, string>();
    sorted.forEach((w, i) => map.set(w, PALETTE[i % PALETTE.length]));
    return map;
  }, [witels]);
}

// ── Page ──────────────────────────────────────────────────────────────────────
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
  const pageSize = 50;

  React.useEffect(() => {
    if (defaultMonth && !start) {
      setStart(defaultMonth);
      setEnd(defaultMonth);
    }
  }, [defaultMonth]);

  React.useEffect(() => {
    setPage(1);
  }, [start, end, selectedWitels, selectedTeldas, kodeSales, sortBy, sortDir]);
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
  const witelColors = useWitelColors(availableWitels);
  const getColor = (w: string) => witelColors.get(w) ?? "#888";

  const hasFilters =
    selectedWitels.length > 0 || selectedTeldas.length > 0 || kodeSales;

  function handleSort(col: SortKey) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  const SortTh = ({
    col,
    children,
    className,
  }: {
    col: SortKey;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon column={col} sortBy={sortBy} sortDir={sortDir} />
      </div>
    </TableHead>
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* ── FILTER CARD ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Data AR</CardTitle>
          <CardDescription>
            Tabel data Account Representative dengan filter periode, witel,
            telda, dan kode sales.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {/* Satu baris filter */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Bulan Awal */}
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

            {/* Bulan Akhir */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Bulan Akhir
              </label>
              <Select
                value={end}
                onValueChange={(v) => {
                  setEnd(v);
                  // kalau start > end baru, sesuaikan start
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

            {/* Divider */}
            <div className="h-9 w-px bg-border" />

            {/* Witel */}
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

            {/* Telda */}
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

            {/* Divider */}
            <div className="h-9 w-px bg-border" />

            {/* Kode Sales / Nama AR */}
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

            {/* Reset */}
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
                    style={{ backgroundColor: getColor(w) }}
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

      {/* ── TABLE CARD ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <SortTh col="kodeSales">Kode Sales</SortTh>
                  <SortTh col="namaAr">Nama AR</SortTh>
                  <SortTh col="witel">Witel</SortTh>
                  <SortTh col="telda">Telda</SortTh>
                  <SortTh col="sales" className="text-right">
                    Sales
                  </SortTh>
                  <SortTh col="poi" className="text-right">
                    POI
                  </SortTh>
                  <SortTh col="coll" className="text-right">
                    Collection
                  </SortTh>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 rounded bg-muted animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-16 text-center text-muted-foreground"
                    >
                      Tidak ada data untuk filter yang dipilih.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row: any, idx: number) => (
                    <TableRow key={`${row.kodeSales}-${idx}`}>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.kodeSales || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.namaAr}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="gap-1.5 font-normal"
                        >
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: getColor(row.witel) }}
                          />
                          {row.witel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.telda || "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {fmtNumber(row.sales)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {fmtNumber(row.poi)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {fmtNumber(row.coll)}
                      </TableCell>
                    </TableRow>
                  ))
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
