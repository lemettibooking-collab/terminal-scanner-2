import { HotTable } from '@/components/hot-table';

export default function HotPage() {
  return (
    <main className="space-y-3">
      <h2 className="text-lg font-semibold">Hot symbols</h2>
      <p className="text-sm text-slate-400">
        Demo feed with mock data. Replace with your real scanner API when ready.
      </p>
      <HotTable />
    </main>
  );
}
