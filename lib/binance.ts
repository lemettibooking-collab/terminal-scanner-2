export type KlineInterval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

export const ALLOWED_INTERVALS: readonly KlineInterval[] = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
] as const;

export type Candle = {
  openTime: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function normalizeSymbol(input: string): string {
  return (input ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function isValidSymbol(sym: string): boolean {
  // базовая проверка, чтобы не пускать мусор
  return /^[A-Z0-9]{5,20}$/.test(sym);
}

function toNum(x: unknown): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchKlines(
  symbolRaw: string,
  interval: KlineInterval,
  limit: number
): Promise<Candle[]> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!isValidSymbol(symbol)) return [];
  if (!ALLOWED_INTERVALS.includes(interval)) return [];
  const safeLimit = Math.min(1000, Math.max(1, Math.floor(limit)));

  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(safeLimit));

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        "accept": "application/json",
      },
    });
    if (!res.ok) return [];

    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) return [];

    // Binance kline array format:
    // [
    //  [
    //    0 openTime,
    //    1 open,
    //    2 high,
    //    3 low,
    //    4 close,
    //    5 volume,
    //    6 closeTime,
    //    ...
    //  ],
    // ]
    const candles: Candle[] = [];
    for (const row of raw) {
      if (!Array.isArray(row) || row.length < 6) continue;
      candles.push({
        openTime: toNum(row[0]),
        open: toNum(row[1]),
        high: toNum(row[2]),
        low: toNum(row[3]),
        close: toNum(row[4]),
        volume: toNum(row[5]),
      });
    }

    return candles;
  } catch {
    return [];
  }
}

