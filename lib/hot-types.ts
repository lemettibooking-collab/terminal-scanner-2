import type { KlineInterval } from "@/lib/binance";
import type { SymbolMetrics } from "@/lib/metrics";

export type HotSymbol = {
  symbol: string;
  price: number;
  changePercent: number; // 24h percent from ticker
  quoteVolume?: number; // raw number (optional)
  volume: string; // compact string, e.g. "84.1M"
  signal: string; // Watch / Momentum / High Volume / Big Move
  score: number; // scanner score
  interval: KlineInterval;
  metrics: SymbolMetrics | null;
};

export type HotResponse = {
  ok: boolean;
  data: HotSymbol[];
  ts: number;
  error?: string;
  meta?: Record<string, unknown>;
};
