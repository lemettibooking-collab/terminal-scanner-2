import { NextResponse } from "next/server";
import {
  ALLOWED_INTERVALS,
  fetchKlines,
  isValidSymbol,
  normalizeSymbol,
  type KlineInterval,
} from "@/lib/binance";
import { calcMetrics } from "@/lib/metrics";

export const runtime = "nodejs";

type OkResp = {
  ok: true;
  symbol: string;
  interval: KlineInterval;
  limit: number;
  candles: Awaited<ReturnType<typeof fetchKlines>>;
  metrics: ReturnType<typeof calcMetrics>;
  ts: number;
};

type ErrResp = {
  ok: false;
  error: string;
  ts: number;
};

function err(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: message, ts: Date.now() } satisfies ErrResp,
    { status, headers: { "cache-control": "no-store" } }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const symbolRaw = url.searchParams.get("symbol") ?? "";
  const intervalRaw = (url.searchParams.get("interval") ?? "1h") as KlineInterval;
  const limitRaw = url.searchParams.get("limit") ?? "120";

  const symbol = normalizeSymbol(symbolRaw);
  if (!isValidSymbol(symbol)) return err("Invalid symbol");

  if (!ALLOWED_INTERVALS.includes(intervalRaw)) {
    return err(`Invalid interval. Allowed: ${ALLOWED_INTERVALS.join(", ")}`);
  }

  const limit = Math.min(1000, Math.max(10, Number(limitRaw) || 120));

  const candles = await fetchKlines(symbol, intervalRaw, limit);
  const metrics = calcMetrics(candles, intervalRaw);

  const payload: OkResp = {
    ok: true,
    symbol,
    interval: intervalRaw,
    limit,
    candles,
    metrics,
    ts: Date.now(),
  };

  return NextResponse.json(payload, {
    headers: { "cache-control": "no-store" },
  });
}

