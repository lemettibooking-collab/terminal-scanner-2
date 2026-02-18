// app/api/hot/route.ts
import { NextResponse } from "next/server";
import { fetchKlines, type KlineInterval } from "@/lib/binance";
import { calcMetrics, type SymbolMetrics } from "@/lib/metrics";

type Binance24hTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

type HotSymbol = {
  symbol: string;
  price: number;
  changePercent: number; // 24h percent from ticker
  quoteVolume: number; // raw number for sorting/filters
  volume: string; // compact string for UI
  signal: string;
  score: number;
  interval: KlineInterval;
  metrics: SymbolMetrics | null;
};

function toNumber(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

function isProbablyStableBase(symbol: string): boolean {
  const base = symbol.replace(/USDT$/, "");
  const STABLE_BASES = new Set([
    "USDC",
    "FDUSD",
    "TUSD",
    "USDP",
    "DAI",
    "BUSD",
    "PAX",
    "USDS",
    "EUR",
    "GBP",
    "TRY",
    "BRL",
  ]);
  return STABLE_BASES.has(base);
}

function isLeveragedOrWeird(symbol: string): boolean {
  return /(UP|DOWN|BULL|BEAR)USDT$/.test(symbol);
}

// --- signal + score from your metrics ---
function classify(metrics: SymbolMetrics | null, changePercent24h: number, quoteVol: number) {
  const vSpike = Number(metrics?.volumeSpike ?? 0);
  const c1h = Number(metrics?.change1h ?? 0);
  const c4h = Number(metrics?.change4h ?? 0);
  const c24h = Number(metrics?.change24h ?? changePercent24h);

  const abs1h = Math.abs(c1h);
  const abs4h = Math.abs(c4h);
  const abs24 = Math.abs(c24h);

  let signal = "Watch";

  // label priority
  if (abs24 >= 10) signal = "Big Move";
  else if (vSpike >= 3 || quoteVol >= 300_000_000) signal = "High Volume";
  else if (abs4h >= 3 || abs1h >= 1.5) signal = "Momentum";

  // score
  let score = 0;

  // volume spike weight
  if (vSpike >= 6) score += 6;
  else if (vSpike >= 4) score += 4.5;
  else if (vSpike >= 3) score += 3.5;
  else if (vSpike >= 2) score += 2;

  // momentum weight
  if (abs1h >= 2) score += 2;
  else if (abs1h >= 1) score += 1;

  if (abs4h >= 4) score += 2;
  else if (abs4h >= 2) score += 1;

  if (abs24 >= 8) score += 2;

  // liquidity bonus
  if (quoteVol >= 500_000_000) score += 1.5;
  else if (quoteVol >= 200_000_000) score += 1;

  // small bonus for trend direction (optional)
  score += Math.min(1.5, abs1h / 2);

  return { signal, score: Number(score.toFixed(2)) };
}

// --- concurrency limiter ---
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });

  await Promise.all(workers);
  return out;
}

// --- in-memory TTL cache ---
let cache: { key: string; ts: number; payload: any } | null = null;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ts = Date.now();

  // params
  // /api/hot?top=40&limit=30&interval=1h&klineLimit=120&ttl=8&concurrency=6&minVol=50000000&includeStables=0
  const top = Math.min(Math.max(Number(url.searchParams.get("top") ?? 40), 1), 200);
  const outLimit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 30), 1), top);

  const interval = (url.searchParams.get("interval") ?? "1h") as KlineInterval;
  const klineLimit = Math.min(Math.max(Number(url.searchParams.get("klineLimit") ?? 120), 30), 500);

  const concurrency = Math.min(Math.max(Number(url.searchParams.get("concurrency") ?? 6), 1), 12);
  const ttlSec = Math.min(Math.max(Number(url.searchParams.get("ttl") ?? 8), 1), 60);

  const minVol = Number(url.searchParams.get("minVol") ?? 50_000_000);
  const includeStables = url.searchParams.get("includeStables") === "1";

  const cacheKey = JSON.stringify({ top, outLimit, interval, klineLimit, minVol, includeStables });

  if (cache && cache.key === cacheKey && ts - cache.ts < ttlSec * 1000) {
    return NextResponse.json(cache.payload, {
      status: 200,
      headers: { "Cache-Control": `public, max-age=${ttlSec}`, "X-Cache": "HIT" },
    });
  }

  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, data: [], ts, error: `Binance HTTP ${r.status}` },
        { status: 502 }
      );
    }

    const all = (await r.json()) as Binance24hTicker[];

    let rows = all.filter((t) => t.symbol.endsWith("USDT"));
    rows = rows.filter((t) => !isLeveragedOrWeird(t.symbol));
    if (!includeStables) rows = rows.filter((t) => !isProbablyStableBase(t.symbol));
    rows = rows.filter((t) => toNumber(t.quoteVolume) >= minVol);
    rows.sort((a, b) => toNumber(b.quoteVolume) - toNumber(a.quoteVolume));

    const picked = rows.slice(0, top);

    const enriched = await mapLimit(picked, concurrency, async (t) => {
      const symbol = t.symbol;
      const price = toNumber(t.lastPrice);
      const changePercent = toNumber(t.priceChangePercent);
      const quoteVol = toNumber(t.quoteVolume);

      const candles = await fetchKlines(symbol, interval, klineLimit);
      const metrics = candles.length ? calcMetrics(candles, interval) : null;

      const { signal, score } = classify(metrics, changePercent, quoteVol);

      const out: HotSymbol = {
        symbol,
        price,
        changePercent,
        quoteVolume: quoteVol,
        volume: formatCompact(quoteVol),
        signal,
        score,
        interval,
        metrics,
      };

      return out;
    });

    // now sort by score (scanner output)
    enriched.sort((a, b) => b.score - a.score);

    const data = enriched.slice(0, outLimit);

    const payload = {
      ok: true,
      data,
      ts,
      meta: { top, outLimit, interval, klineLimit, concurrency, ttlSec, minVol, includeStables },
    };

    cache = { key: cacheKey, ts, payload };

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": `public, max-age=${ttlSec}`, "X-Cache": "MISS" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    // чтобы UI не краснел — можно вернуть status 200, но пока оставим 500 для честности
    return NextResponse.json({ ok: false, data: [], ts, error: msg }, { status: 500 });
  }
}
