import Link from 'next/link';

type SymbolPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function SymbolPage({ params }: 
SymbolPageProps) {
  const { symbol } = await params;
  const upper = (symbol ?? '').toUpperCase();

  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold">{upper}</h2>
      <div className="rounded-lg border border-slate-800 
bg-slate-900/40 p-4 text-sm text-slate-300">
        <p>This page is a placeholder for symbol-level 
analytics.</p>
        <p className="mt-2">Add candles, orderflow and scanner 
details here.</p>
      </div>
      <Link href="/hot" className="text-sm text-blue-300 
hover:text-blue-200">
        ← Back to hot list
      </Link>
    </main>
  );
}
import Link from 
'next/link';

type SymbolPageProps = {
  params: {
    symbol: string;
  };
};

export default function SymbolPage({ params }: SymbolPageProps) {
  const symbol = params.symbol.toUpperCase();

  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold">{symbol}</h2>
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
        <p>This page is a placeholder for symbol-level analytics.</p>
        <p className="mt-2">Add candles, orderflow and scanner details here.</p>
      </div>
      <Link href="/hot" className="text-sm text-blue-300 hover:text-blue-200">
        ← Back to hot list
      </Link>
    </main>
  );
}
