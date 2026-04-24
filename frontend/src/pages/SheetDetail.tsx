import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchSheet } from "../api/sheets";
import { AddLogEntryRunDialog } from "../components/sheet/AddLogEntryRunDialog";
import { sheetKeys } from "../lib/sheetQueryKeys";

interface Props {
  sheetId: number;
  onBack: () => void;
}

export default function SheetDetail({ sheetId, onBack }: Props) {
  const [addRunOpen, setAddRunOpen] = useState(false);
  const { data: sheet, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: sheetKeys.detail(sheetId),
    queryFn: () => fetchSheet(sheetId),
  });

  if (isPending) return <p className="text-gray-500">Loading…</p>;

  if (isError) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to sheets
        </button>
        <p className="text-red-600">{message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 hover:bg-red-50 disabled:opacity-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sheet) return null;

  return (
    <div>
      <AddLogEntryRunDialog open={addRunOpen} onClose={() => setAddRunOpen(false)} />
      <button
        type="button"
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
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Log Entry Runs
          </h3>
          <button
            type="button"
            onClick={() => setAddRunOpen(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Add run
          </button>
        </div>
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
