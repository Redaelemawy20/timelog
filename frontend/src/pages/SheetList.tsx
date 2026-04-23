import { useEffect, useMemo, useState } from "react";
import { ChevronRightIcon } from "../components/icons/ChevronRightIcon";
import { SheetListSkeleton } from "../components/sheet/SheetListSkeleton";
import { fetchSheets } from "../api/sheets";
import { sheetToSummary } from "../lib/sheetSummary";
import type { SheetSummary } from "../types/sheet";

interface Props {
  onSelect: (id: number) => void;
}

export default function SheetList({ onSelect }: Props) {
  const [sheets, setSheets] = useState<SheetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    fetchSheets(ac.signal)
      .then((rows) => {
        if (active) setSheets(rows.map(sheetToSummary));
      })
      .catch((e: unknown) => {
        if (!active) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      ac.abort();
    };
  }, [loadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sheets;
    return sheets.filter((s) => s.name.toLowerCase().includes(q));
  }, [sheets, query]);

  const retry = () => setLoadKey((k) => k + 1);

  if (loading) return <SheetListSkeleton />;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{error}</span>
        <button
          type="button"
          onClick={retry}
          className="shrink-0 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sheets.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-600">
        <p className="font-medium text-gray-800">No sheets yet</p>
        <p className="mt-2 text-gray-500">
          Sheets are created in your workspace or admin flow. Once they exist, they will show up here.
        </p>
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="space-y-3">
        <label className="block text-sm text-gray-600">
          <span className="sr-only">Filter sheets</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name…"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <p className="text-sm text-gray-500">No sheets match “{query.trim()}”. Try another search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-600">
        <span className="sr-only">Filter sheets</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name…"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>

      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        {filtered.map((sheet) => (
          <li key={sheet.id}>
            <button
              type="button"
              onClick={() => onSelect(sheet.id)}
              className="w-full px-4 py-3.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
            >
              <span className="flex-1 min-w-0">
                <span className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{sheet.name}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Updated {new Date(sheet.updated_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                </span>
                {(sheet.repo_count > 0 || sheet.latest_run_summary) && (
                  <span className="mt-1 block text-sm text-gray-500">
                    {sheet.repo_count > 0 ? (
                      <>
                        {sheet.repo_count} {sheet.repo_count === 1 ? "repo" : "repos"}
                      </>
                    ) : null}
                    {sheet.latest_run_summary ? (
                      <>
                        {sheet.repo_count > 0 ? (
                          <span className="text-gray-300 mx-1.5" aria-hidden>
                            ·
                          </span>
                        ) : null}
                        Latest run: {sheet.latest_run_summary}
                      </>
                    ) : null}
                  </span>
                )}
              </span>
              <ChevronRightIcon />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
