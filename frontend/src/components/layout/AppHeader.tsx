import type { GithubTokenStatus } from "../../types/github";
import { tokenChipLabel, tokenTooltip } from "../../lib/githubTokenDisplay";

interface AppHeaderProps {
  tokenStatus: GithubTokenStatus | null;
  onNavigateHome: () => void;
}

export function AppHeader({ tokenStatus, onNavigateHome }: AppHeaderProps) {
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
  );
}
