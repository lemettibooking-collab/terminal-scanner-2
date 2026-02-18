import { HotClient } from "@/components/hot-client";
import type { HotResponse } from "@/lib/hot-types";

export default async function HotPage() {
  const res = await fetch("/api/hot", { cache: "no-store" });
  const json = (await res.json()) as HotResponse;

  return (
    <main className="space-y-3">
      <h2 className="text-lg font-semibold">Hot symbols</h2>

      {!json.ok ? (
        <p className="text-sm text-rose-400">
          API error: {json.error ?? "Unknown error"}
        </p>
      ) : (
        <p className="text-sm text-slate-400">
          Scanner feed (sorted by score). Updated:{" "}
          {new Date(json.ts).toLocaleTimeString()}
        </p>
      )}

      <HotClient initialRows={json?.data ?? []} />
    </main>
  );
}