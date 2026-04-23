import { useEffect, useState } from "react";
import { fetchGithubTokenStatus } from "./api";
import SheetList from "./pages/SheetList";
import SheetDetail from "./pages/SheetDetail";
import type { GithubTokenStatus } from "./types";

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tokenStatus, setTokenStatus] = useState<GithubTokenStatus | null>(null);

  useEffect(() => {
    fetchGithubTokenStatus().then(setTokenStatus).catch(() => {
      setTokenStatus({ phase: "api_error", api_error: "Unable to fetch token status." });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1
          className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setSelectedId(null)}
        >
          Time Log
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {tokenStatus && (
          <div
            className={`mb-4 rounded-md border px-3 py-2 text-sm ${
              tokenStatus.phase === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {tokenStatus.phase === "success"
              ? `GitHub token is valid (${tokenStatus.login})`
              : tokenStatus.phase === "not_configured"
                ? "GitHub token is not configured."
                : tokenStatus.file_error || tokenStatus.api_error || "GitHub token check failed."}
          </div>
        )}
        {selectedId === null ? (
          <>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Sheets</h2>
            <SheetList onSelect={setSelectedId} />
          </>
        ) : (
          <SheetDetail sheetId={selectedId} onBack={() => setSelectedId(null)} />
        )}
      </main>
    </div>
  );
}
