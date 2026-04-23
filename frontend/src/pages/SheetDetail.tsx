import { useEffect, useState } from "react";
import { fetchSheet } from "../api";
import type { SheetDetail as SheetDetailType } from "../types";

interface Props {
  sheetId: number;
  onBack: () => void;
}

export default function SheetDetail({ sheetId, onBack }: Props) {
  const [sheet, setSheet] = useState<SheetDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSheet(sheetId)
      .then(setSheet)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [sheetId]);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!sheet) return null;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Back to sheets
      </button>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{sheet.name}</h2>

      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
          Repos
        </h3>
        {sheet.repos.length ? (
          <ul className="space-y-1">
            {sheet.repos.map((r) => (
              <li key={r.id} className="text-gray-700">
                {r.display_name ?? `${r.owner}/${r.name}`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No repos linked.</p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
          Log Entry Runs
        </h3>
        {sheet.log_entry_runs.length ? (
          <div className="space-y-4">
            {sheet.log_entry_runs.map((run) => (
              <div
                key={run.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">
                    {run.range_start} → {run.range_end}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      run.status === "saved"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
                {run.log_entries.length > 0 && (
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        <th className="pb-1 pr-4">Project</th>
                        <th className="pb-1 pr-4">Task</th>
                        <th className="pb-1">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.log_entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-1 pr-4 text-gray-700">{entry.project}</td>
                          <td className="py-1 pr-4 text-gray-600">{entry.task || "—"}</td>
                          <td className="py-1 text-gray-700">{entry.time_hours ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No runs yet.</p>
        )}
      </section>
    </div>
  );
}
