import type { GithubTokenStatus } from "../../types/github";
import { tokenChipLabel, tokenTooltip } from "../../lib/githubTokenDisplay";

interface AppHeaderProps {
  tokenStatus: GithubTokenStatus | null;
  onNavigateHome: () => void;
  onNewSheet: () => void;
}

export function AppHeader({ tokenStatus, onNavigateHome, onNewSheet }: AppHeaderProps) {
  const tokenOk = tokenStatus?.phase === "success";

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <button
          type="button"
          onClick={onNavigateHome}
          className="text-left rounded-lg px-2 py-1.5 -mx-2 -my-1.5 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <h1 className="text-xl font-bold text-gray-900">Time Log</h1>
          <p className="text-sm text-gray-500 font-normal mt-0.5 max-w-md">
            Pick a sheet to see repos and time log runs.
          </p>
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 shrink-0 sm:self-start">
          <button
            type="button"
            onClick={onNewSheet}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            New sheet
          </button>
          {tokenStatus ? (
            <span
              title={tokenTooltip(tokenStatus)}
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                tokenOk
                  ? "border-gray-200 bg-gray-50 text-gray-700"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {tokenChipLabel(tokenStatus)}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
