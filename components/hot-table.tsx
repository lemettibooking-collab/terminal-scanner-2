"use client";

import Link from "next/link";
import type { HotSymbol } from "@/lib/hot-types";

type SortKey =
  | "score"
  | "symbol"
  | "price"
  | "changePercent"
  | "volume"
  | "volumeSpike"
  | "signal";
type SortDir = "asc" | "desc";

type HotTableProps = {
  rows: HotSymbol[];

  // опционально (если захочешь кликабельные заголовки)
  onSort?: (key: SortKey) => void;
  sortKey?: SortKey;
  sortDir?: SortDir;
};

function SortHeader({
  label,
  k,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  k: SortKey;
  activeKey?: SortKey;
  dir?: SortDir;
  onSort?: (key: SortKey) => void;
}) {
  const isActive = activeKey === k;

  if (!onSort) return <span>{label}</span>;

  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className="inline-flex items-center gap-2 hover:text-white"
      title="Sort"
    >
      <span>{label}</span>
      {isActive ? (
        <span className="text-slate-400">{dir === "asc" ? "↑" : "↓"}</span>
      ) : null}
    </button>
  );
}

export function HotTable({ rows, onSort, sortKey, sortDir }: HotTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-300">
          <tr>
            <th className="px-4 py-3">
              <SortHeader
                label="Score"
                k="score"
                onSort={onSort}
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Symbol"
                k="symbol"
                onSort={onSort}
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Price"
                k="price"
                onSort={onSort}
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="24h %"
                k="changePercent"
                onSort={onSort}
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Volume"
                k="volume"
                onSort={onSort}
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Vol spike"
                k="volumeSpike"
                onSort={onSort}
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Signal"
                k="signal"
                onSort={onSort}
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.symbol}
              className="border-t border-slate-800 hover:bg-slate-900/60"
            >
              <td className="px-4 py-3 font-semibold">
                {Number(row.score ?? 0).toFixed(2)}
              </td>

              <td className="px-4 py-3 font-medium text-blue-300">
                <Link href={`/symbol/${row.symbol}`}>{row.symbol}</Link>
              </td>

              <td className="px-4 py-3">${Number(row.price ?? 0).toFixed(2)}</td>

              <td
                className={`px-4 py-3 ${(row.changePercent ?? 0) >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                  }`}
              >
                {(row.changePercent ?? 0) >= 0 ? "+" : ""}
                {Number(row.changePercent ?? 0).toFixed(2)}%
              </td>

              <td className="px-4 py-3">{row.volume}</td>

              <td className="px-4 py-3">
                {row.metrics?.volumeSpike != null
                  ? `${Number(row.metrics.volumeSpike).toFixed(2)}x`
                  : "—"}
              </td>

              <td className="px-4 py-3">{row.signal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
