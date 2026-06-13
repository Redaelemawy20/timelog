import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { exportPublicSheetExcel, fetchPublicSheet } from "../api/sheets";
import type { PublicSprintSnapshot } from "../types/sheet";

function formatDate(value: string) {
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatHours(value: string | null) {
  if (!value) return "—";
  const h = parseFloat(value);
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs && mins) return `${hrs}h ${mins}m`;
  if (hrs) return `${hrs}h`;
  if (mins) return `${mins}m`;
  return "—";
}

function SprintRow({ sprint, index }: { sprint: PublicSprintSnapshot; index: number }) {
  return (
    <div className={`border rounded-xl p-5 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"} print:border-slate-200 print:rounded-none print:border-0 print:border-b`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <span>{formatDate(sprint.range_start)}</span>
          <span className="text-slate-300">→</span>
          <span>{formatDate(sprint.range_end)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full print:bg-transparent print:px-0">
          <span>{formatHours(sprint.time_hours)}</span>
        </div>
      </div>

      {sprint.summary ? (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">{sprint.summary}</p>
      ) : (
        <p className="text-sm text-slate-400 italic mb-3">No summary.</p>
      )}

      {sprint.projects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sprint.projects.map((p) => (
            <span key={p} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full print:bg-transparent print:border-slate-300 print:text-slate-600">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [isExporting, setIsExporting] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ["public-share", token],
    queryFn: () => fetchPublicSheet(token!),
    enabled: !!token,
    retry: false,
  });

  const handleExportExcel = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      await exportPublicSheetExcel(token);
    } finally {
      setIsExporting(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3 text-center px-4">
        <FileText className="size-10 text-slate-300" />
        <h1 className="text-lg font-semibold text-slate-600">This page is not available</h1>
        <p className="text-sm text-slate-400">The link may have expired or been unpublished.</p>
      </div>
    );
  }

  const { snapshot, include_previous_hours, remaining_hours } = data;
  const totalHours = formatHours(
    snapshot.total_hours ? String(snapshot.total_hours) : null
  );
  const previousHours = parseFloat(remaining_hours || "0");
  const grandTotal = snapshot.total_hours + previousHours;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="bg-white border-b print:border-slate-200 print:shadow-none shadow-sm">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-widest text-slate-400 uppercase mb-1">{snapshot.client_name}</p>
              <h1 className="text-2xl font-bold text-slate-800">{snapshot.sheet_name}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Published {new Date(snapshot.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Worked</p>
                <p className="text-3xl font-bold text-slate-800">{totalHours}</p>
              </div>
              {include_previous_hours && (
                <div className="text-xs text-slate-500">
                  <span className="text-slate-400">Previous:</span> {formatHours(String(previousHours))}
                  <span className="mx-1 text-slate-300">·</span>
                  <span className="font-semibold text-slate-700">Total: {formatHours(String(grandTotal))}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={() => void handleExportExcel()}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition-colors"
            >
              {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Download Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <FileText className="size-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-8 print:px-0 print:py-4">
        {snapshot.sprints.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-16">No sprints in this sheet.</p>
        ) : (
          <div className="space-y-3 print:space-y-0">
            {snapshot.sprints.map((sprint, i) => (
              <SprintRow key={i} sprint={sprint} index={i} />
            ))}
          </div>
        )}
      </main>

      <div className="hidden print:block fixed bottom-0 left-0 right-0 text-center text-xs text-slate-400 pb-4">
        {snapshot.sheet_name} · {snapshot.client_name}
      </div>
    </div>
  );
}
