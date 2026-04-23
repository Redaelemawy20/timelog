import { useEffect, useState } from "react";
import { fetchSheets } from "../api";
import type { Sheet } from "../types";

interface Props {
  onSelect: (id: number) => void;
}

export default function SheetList({ onSelect }: Props) {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSheets()
      .then(setSheets)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading sheets…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!sheets.length) return <p className="text-gray-400">No sheets found.</p>;

  return (
    <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm">
      {sheets.map((sheet) => (
        <li key={sheet.id}>
          <button
            onClick={() => onSelect(sheet.id)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-800">{sheet.name}</span>
            <span className="ml-2 text-xs text-gray-400">
              updated {new Date(sheet.updated_at).toLocaleDateString()}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
