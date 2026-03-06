// Mapping witel → warna sesuai global.css
// Gunakan file ini di semua komponen chart yang pakai warna witel

export const WITEL_COLOR_MAP: Record<string, string> = {
  Aceh: "var(--witel-1)", // #2563eb biru
  Sumut: "var(--witel-2)", // #16a34a hijau
  Riau: "var(--witel-3)", // #dc2626 merah
  "Sumbar Jambi": "var(--witel-4)", // #d97706 kuning
  Sumbagsel: "var(--witel-5)", // #7c3aed ungu
  "Lampung Bengkulu": "var(--witel-6)", // #0891b2 cyan
};

/** Ambil warna witel berdasarkan nama. Fallback ke abu-abu kalau tidak ditemukan. */
export function getWitelColor(witel: string): string {
  return WITEL_COLOR_MAP[witel] ?? "var(--muted-foreground)";
}
