"use client";

import { useEffect, useMemo, useState } from "react";
import type { Candle, KlineInterval } from "@/lib/binance";
import type { SymbolMetrics } from "@/lib/metrics";
import Link from "next/link";

type ApiOk = {
  ok: true;
  symbol: string;
  interval: KlineInterval;
  limit: number;
  candles: Candle[];
  metrics: SymbolMetrics;
  ts: number;
};

type ApiErr = {
  ok: false;
  error: string;
  ts: number;
};

type ApiResp = ApiOk | ApiErr;

function fmtNum(n: number | null, digits = 4) {
  if (n == null) return "—";
  return n.toFixed(digits);
}

function fmtPct(n: number | null) {
  if (n == null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function fmtSpike(n: number | null) {
  if (n == null) return "—";
  return `${n.toFixed(2)}x`;
}

function Sparkline({ values }: { values: number[] }) {
  const { d } = useMemo(() => {
    if (!values.length) return { d: "" };

    const w = 220;
    const h = 44;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / span) * h;
      return [x, y] as const;
    });

    const path = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(" ");

    return { d: path };
  }, [values]);

  return (
    <svg width="220" height="44" viewBox="0 0 220 44" className="rounded bg-slate-950/40 border 
border-slate-800">
      {d ? <path d={d} fill="none" stroke="currentColor" strokeWidth="2" /> : null}
    </svg>
  );
}

export function SymbolClient({
  symbol,
  initialCandles,
  initialMetrics,
}: {
  symbol: string;
  initialCandles: Candle[];
  initialMetrics: SymbolMetrics;
}) {
  const [interval, setKlineInterval] = useState<KlineInterval>("1h");
  const [limit, setLimit] = useState(120);

  const [candles, setCandles] = useState<Candle[]>(initialCandles ?? []);
  const [metrics, setMetrics] = useState<SymbolMetrics>(initialMetrics);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshEverySec, setRefreshEverySec] = useState(10);

  const [loading, setLoading] = useState(false);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams({
        symbol,
        interval,
        limit: String(limit),
      });

      const res = await fetch(`/api/klines?${qs.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as ApiResp;

      if (!json.ok) throw new Error(json.error || "Unknown API error");

      setCandles(json.candles ?? []);
      setMetrics(json.metrics);
      setLastTs(json.ts ?? Date.now());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // когда меняем interval/limit — обновим один раз
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, limit]);

  useEffect(() => {
    if (!autoRefresh) return;
    const ms = Math.max(3, refreshEverySec) * 1000;
    const id = setInterval(() => refresh(), ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshEverySec, interval, limit]);

  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const last10 = useMemo(() => candles.slice(-10).reverse(), [candles]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{symbol}</h2>
          <Sparkline values={closes.slice(-60)} />
        </div>
        <Link href="/hot" className="text-sm text-blue-300 hover:text-blue-200">
          ← Back to hot list
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Interval:</span>
          <select
            value={interval}
            onChange={(e) => setKlineInterval(e.target.value as KlineInterval)}
            className="rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-2 text-sm"
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Limit:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-2 text-sm"
          >
            <option value={60}>60</option>
            <option value={120}>120</option>
            <option value={240}>240</option>
            <option value={500}>500</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4"
            />
            Auto refresh
          </label>

          <select
            value={refreshEverySec}
            onChange={(e) => setRefreshEverySec(Number(e.target.value))}
            disabled={!autoRefresh}
            className="rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-2 text-sm"
            title="Refresh interval"
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>

          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm 
hover:border-slate-600"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>Rows: {candles.length}</span>
        {lastTs ? <span>Last update: {new Date(lastTs).toLocaleTimeString()}</span> : null}
        {error ? <span className="text-rose-400">Error: {error}</span> : null}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-500">ATR(14)</div>
          <div className="text-sm font-semibold">{fmtNum(metrics.atr14, 6)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-500">% change 1h</div>
          <div className="text-sm font-semibold">{fmtPct(metrics.change1h)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-500">% change 4h</div>
          <div className="text-sm font-semibold">{fmtPct(metrics.change4h)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-500">% change 24h</div>
          <div className="text-sm font-semibold">{fmtPct(metrics.change24h)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-500">Volume spike</div>
          <div className="text-sm font-semibold">{fmtSpike(metrics.volumeSpike)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-4 py-3">Time (UTC)</th>
              <th className="px-4 py-3">Open</th>
              <th className="px-4 py-3">High</th>
              <th className="px-4 py-3">Low</th>
              <th className="px-4 py-3">Close</th>
              <th className="px-4 py-3">Volume</th>
            </tr>
          </thead>

          <tbody>
            {last10.map((c) => {
              const t = new Date(c.openTime).toISOString().replace("T", " ").slice(0, 19) +
                "Z";
              return (
                <tr key={c.openTime} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-slate-400">{t}</td>
                  <td className="px-4 py-3">{c.open}</td>
                  <td className="px-4 py-3">{c.high}</td>
                  <td className="px-4 py-3">{c.low}</td>
                  <td className="px-4 py-3">{c.close}</td>
                  <td className="px-4 py-3">{c.volume}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

