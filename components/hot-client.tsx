"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HotTable } from "@/components/hot-table";
import type { HotSymbol } from "@/lib/mock-data";

type HotResponse = {
  ok: boolean;
  data: HotSymbol[];
  ts: number;
};

type SortKey = "symbol" | "price" | "changePercent" | "volume" | "signal";
type SortDir = "asc" | "desc";

function parseVolume(v: string) {
  // "84.1M" -> 84100000, "1.2B" -> 1200000000
  const s = (v ?? "").trim().toUpperCase();

  // оставляем цифры и точку, убираем все буквы/пробелы
  const num = Number(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return 0;

  if (s.endsWith("B")) return num * 1_000_000_000;
  if (s.endsWith("M")) return num * 1_000_000;
  if (s.endsWith("K")) return num * 1_000;
  return num;
}

function getSortValue(row: HotSymbol, key: SortKey): string | number {
  switch (key) {
    case "symbol":
      return (row.symbol ?? "").toUpperCase();
    case "signal":
      return (row.signal ?? "").toUpperCase();
    case "price":
      return Number(row.price ?? 0);
    case "changePercent":
      return Number(row.changePercent ?? 0);
    case "volume":
      return parseVolume(row.volume ?? "");
    default:
      return "";
  }
}

export function HotClient({ initialRows }: { initialRows: HotSymbol[] }) {
  const [rows, setRows] = useState<HotSymbol[]>(initialRows ?? []);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("changePercent");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalSec, setIntervalSec] = useState(5);

  const [loading, setLoading] = useState(false);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/hot", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as HotResponse;
      if (!json?.ok) throw new Error("API returned ok=false");

      setRows(json.data ?? []);
      setLastTs(json.ts ?? Date.now());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // авто-обновление
  useEffect(() => {
    if (!autoRefresh) return;

    const ms = Math.max(2, intervalSec) * 1000;
    const id = window.setInterval(() => {
      refresh();
    }, ms);

    return () => window.clearInterval(id);
  }, [autoRefresh, intervalSec, refresh]);

  // фильтрация + сортировка
  const filteredSorted = useMemo(() => {
    const needle = q.trim().toUpperCase();

    const filtered = needle
      ? rows.filter((r) => {
          const sym = (r.symbol ?? "").toUpperCase();
          const sig = (r.signal ?? "").toUpperCase();
          return sym.includes(needle) || sig.includes(needle);
        })
      : rows;

    const dir = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);

      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [rows, q, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (symbol or signal)…"
          className="w-64 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm 
text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-600"
        />

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Sort:</span>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-2 text-sm"
            title="Sort key"
          >
            <option value="changePercent">% change</option>
            <option value="volume">volume</option>
            <option value="price">price</option>
            <option value="symbol">symbol</option>
            <option value="signal">signal</option>
          </select>

          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm 
hover:border-slate-600"
            title="Toggle direction"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
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
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value))}
            className="rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-2 text-sm"
            disabled={!autoRefresh}
            title="Refresh interval"
          >
            <option value={3}>3s</option>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
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

      {/* Info row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>Rows: {filteredSorted.length}</span>
        {lastTs ? <span>Last update: {new Date(lastTs).toLocaleTimeString()}</span> : null}
        {error ? <span className="text-rose-400">Error: {error}</span> : null}
      </div>

      {/* Table (ВАЖНО: только rows) */}
      <HotTable rows={filteredSorted} />
    </div>
  );
}

