export default function SettingsPage() {
  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold">Scanner settings</h2>

      <form className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">w1</span>
          <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-400 focus:ring" type="number" step="0.1" defaultValue={1} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">w2</span>
          <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-400 focus:ring" type="number" step="0.1" defaultValue={1} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">w3</span>
          <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-400 focus:ring" type="number" step="0.1" defaultValue={0.7} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">priceSpikePct</span>
          <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-400 focus:ring" type="number" step="0.1" defaultValue={1.5} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">volumeRatio</span>
          <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-400 focus:ring" type="number" step="0.1" defaultValue={4} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">tradesRatio</span>
          <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-400 focus:ring" type="number" step="0.1" defaultValue={5} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">minPrice</span>
          <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-400 focus:ring" type="number" step="0.0001" defaultValue={0} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">minDailyVolume</span>
          <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-400 focus:ring" type="number" step="0.0001" defaultValue={0} />
        </label>

        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" defaultChecked className="h-4 w-4 accent-blue-500" />
          <span className="text-slate-300">onlyUsdt</span>
        </label>

        <button
          type="submit"
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400 md:col-span-2 md:justify-self-start"
        >
          Save settings
        </button>
      </form>
    </main>
  );
}
