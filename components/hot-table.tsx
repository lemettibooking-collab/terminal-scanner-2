import Link from 'next/link';
import { hotSymbols } from '@/lib/mock-data';

export function HotTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-300">
          <tr>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">24h %</th>
            <th className="px-4 py-3">Volume</th>
            <th className="px-4 py-3">Signal</th>
          </tr>
        </thead>
        <tbody>
          {hotSymbols.map((row) => (
            <tr key={row.symbol} className="border-t border-slate-800 hover:bg-slate-900/60">
              <td className="px-4 py-3 font-medium text-blue-300">
                <Link href={`/symbol/${row.symbol}`}>{row.symbol}</Link>
              </td>
              <td className="px-4 py-3">${row.price.toFixed(2)}</td>
              <td className={`px-4 py-3 ${row.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {row.changePercent >= 0 ? '+' : ''}
                {row.changePercent.toFixed(2)}%
              </td>
              <td className="px-4 py-3">{row.volume}</td>
              <td className="px-4 py-3">{row.signal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
