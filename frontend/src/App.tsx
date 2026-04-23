import { useEffect, useState } from "react";
import { fetchGithubTokenStatus } from "./api";
import SheetList from "./pages/SheetList";
import SheetDetail from "./pages/SheetDetail";
import type { GithubTokenStatus } from "./types";

function tokenTooltip(status: GithubTokenStatus): string {
  if (status.phase === "success") {
    return `GitHub token is valid (${status.login ?? "connected"})`;
  }
  if (status.phase === "not_configured") {
    return "GitHub token is not configured.";
  }
  return status.file_error || status.api_error || "GitHub token check failed.";
}

function tokenChipLabel(status: GithubTokenStatus): string {
  if (status.phase === "success") {
    return `GitHub · ${status.login ?? "connected"}`;
  }
  return "GitHub · needs attention";
}

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tokenStatus, setTokenStatus] = useState<GithubTokenStatus | null>(null);

  useEffect(() => {
    fetchGithubTokenStatus().then(setTokenStatus).catch(() => {
      setTokenStatus({ phase: "api_error", api_error: "Unable to fetch token status." });
    });
  }, []);

  const tokenOk = tokenStatus?.phase === "success";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-left rounded-lg px-2 py-1.5 -mx-2 -my-1.5 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <h1 className="text-xl font-bold text-gray-900">Time Log</h1>
            <p className="text-sm text-gray-500 font-normal mt-0.5 max-w-md">
              Pick a sheet to see repos and time log runs.
            </p>
          </button>
          {tokenStatus && (
            <span
              title={tokenTooltip(tokenStatus)}
              className={`inline-flex shrink-0 items-center self-start rounded-full border px-2.5 py-1 text-xs font-medium ${
                tokenOk
                  ? "border-gray-200 bg-gray-50 text-gray-700"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {tokenChipLabel(tokenStatus)}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {selectedId === null ? (
          <section aria-labelledby="sheets-heading">
            <h2 id="sheets-heading" className="text-lg font-semibold text-gray-900">
              Sheets
            </h2>
            <p className="text-sm text-gray-500 mt-1 mb-6 max-w-2xl">
              Each sheet groups repositories and log entry runs for a workspace or initiative.
            </p>
            <SheetList onSelect={setSelectedId} />
          </section>
        ) : (
          <SheetDetail sheetId={selectedId} onBack={() => setSelectedId(null)} />
        )}
      </main>
    </div>
  );
}
