import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { fetchGithubRepos } from "../../api/github";
import {
  addLogEntryRunDraftSchema,
  MAX_REPOS_PER_LOG_ENTRY_RUN,
  type AddLogEntryRunDraft,
} from "../../lib/addLogEntryRunSchema";

interface AddLogEntryRunDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (draft: AddLogEntryRunDraft) => void;
}

export function AddLogEntryRunDialog({ open, onClose, onCreate }: AddLogEntryRunDialogProps) {
  const titleId = useId();
  const rangeStartId = useId();
  const rangeEndId = useId();

  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: repos,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["github-repos"],
    queryFn: fetchGithubRepos,
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    setRangeStart("");
    setRangeEnd("");
    setSelectedRepoIds([]);
    setFormError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isDraftValid = useMemo(
    () =>
      addLogEntryRunDraftSchema.safeParse({
        repoIds: selectedRepoIds,
        rangeStart,
        rangeEnd,
      }).success,
    [selectedRepoIds, rangeStart, rangeEnd],
  );

  const toggleRepo = (id: number) => {
    setSelectedRepoIds((prev) => {
      if (prev.includes(id)) {
        setFormError(null);
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_REPOS_PER_LOG_ENTRY_RUN) {
        setFormError(
          `You can select at most ${MAX_REPOS_PER_LOG_ENTRY_RUN} repositories.`,
        );
        return prev;
      }
      setFormError(null);
      return [...prev, id];
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = addLogEntryRunDraftSchema.safeParse({
      repoIds: selectedRepoIds,
      rangeStart,
      rangeEnd,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setFormError(null);
    onCreate?.(parsed.data);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg border border-gray-200 flex flex-col max-h-[80vh]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Add log entry run
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose up to {MAX_REPOS_PER_LOG_ENTRY_RUN} repositories and the time range for this run.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={rangeStartId} className="block text-sm font-medium text-gray-700">
                Start date
              </label>
              <input
                id={rangeStartId}
                type="date"
                value={rangeStart}
                onChange={(e) => {
                  setRangeStart(e.target.value);
                  setFormError(null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor={rangeEndId} className="block text-sm font-medium text-gray-700">
                End date
              </label>
              <input
                id={rangeEndId}
                type="date"
                value={rangeEnd}
                onChange={(e) => {
                  setRangeEnd(e.target.value);
                  setFormError(null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Selected {selectedRepoIds.length} / {MAX_REPOS_PER_LOG_ENTRY_RUN} repositories
          </p>

          <div className="mt-2 flex-1 min-h-0 overflow-y-auto -mx-6 px-6 border-t border-gray-100 pt-3">
            {isPending && (
              <p className="text-sm text-gray-400 py-4 text-center">Loading repos…</p>
            )}

            {isError && (
              <p className="text-sm text-red-600 py-4 text-center">
                {error instanceof Error ? error.message : "Failed to load repos."}
              </p>
            )}

            {repos && repos.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No repositories found.</p>
            )}

            {repos && repos.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {repos.map((repo) => {
                  const selected = selectedRepoIds.includes(repo.id);
                  return (
                    <li key={repo.id}>
                      <button
                        type="button"
                        onClick={() => toggleRepo(repo.id)}
                        aria-pressed={selected}
                        className={`flex w-full items-start justify-between gap-3 py-3 text-left rounded-md px-1 -mx-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${selected ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-gray-50"
                          }`}
                      >
                        <div className="min-w-0 flex items-start gap-2">
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 bg-white"
                              }`}
                            aria-hidden
                          >
                            {selected ? (
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden
                              >
                                <path d="M2.5 6.2 5 8.7 9.5 3.3" />
                              </svg>
                            ) : null}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{repo.full_name}</p>
                            {repo.description ? (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{repo.description}</p>
                            ) : null}
                          </div>
                        </div>
                        {repo.private ? (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                            private
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {formError ? <p className="mt-3 text-sm text-red-600">{formError}</p> : null}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !!isError || !isDraftValid}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
