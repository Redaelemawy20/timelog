import { useQueries, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { fetchGithubRepoBranches, fetchGithubRepos } from "../../api/github";
import { addSprintDraftSchema, MAX_REPOS_PER_SPRINT } from "../../lib/addSprintSchema";
import type { CreateSprintPayload } from "../../types/sheet";
import { RepoBranchPicker } from "./RepoBranchPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AddSprintDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: CreateSprintPayload) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
}

function defaultBranchesForRepo(defaultBranch: string, available: string[]): string[] {
  if (available.includes(defaultBranch)) return [defaultBranch];
  return available.length > 0 ? [available[0]] : [];
}

export function AddSprintDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = null,
}: AddSprintDialogProps) {
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [branchesByRepoId, setBranchesByRepoId] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const initializedBranchReposRef = useRef<Set<number>>(new Set());

  const { data: repos, isPending, isError, error } = useQuery({
    queryKey: ["github-repos"],
    queryFn: fetchGithubRepos,
    enabled: open,
    staleTime: 60_000,
  });

  const selectedRepos = useMemo(
    () => (repos ?? []).filter((repo) => selectedRepoIds.includes(repo.id)),
    [repos, selectedRepoIds],
  );

  const branchQueryConfigs = useMemo(
    () =>
      selectedRepos.map((repo) => ({
        queryKey: ["github-branches", repo.owner_login, repo.name] as const,
        queryFn: () => fetchGithubRepoBranches(repo.owner_login, repo.name),
        enabled: open,
        staleTime: 60_000,
      })),
    [open, selectedRepos],
  );

  const branchQueries = useQueries({ queries: branchQueryConfigs });

  const branchStateByRepoId = useMemo(() => {
    const map = new Map<number, { branches: string[]; isPending: boolean; isError: boolean }>();
    selectedRepos.forEach((repo, index) => {
      const query = branchQueries[index];
      map.set(repo.id, {
        branches: (query?.data ?? []).map((branch) => branch.name),
        isPending: Boolean(query?.isPending),
        isError: Boolean(query?.isError),
      });
    });
    return map;
  }, [branchQueries, selectedRepos]);

  const branchAvailabilityKey = useMemo(
    () =>
      selectedRepos
        .map((repo) => {
          const state = branchStateByRepoId.get(repo.id);
          return `${repo.id}:${state?.isPending ? "pending" : state?.branches.join(",") ?? ""}`;
        })
        .join("|"),
    [branchStateByRepoId, selectedRepos],
  );

  useEffect(() => {
    if (!open) return;
    setRangeStart("");
    setRangeEnd("");
    setSelectedRepoIds([]);
    setBranchesByRepoId({});
    setFormError(null);
    initializedBranchReposRef.current = new Set();
  }, [open]);

  useEffect(() => {
    if (!open || !repos?.length || selectedRepoIds.length === 0) return;

    setBranchesByRepoId((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const repoId of selectedRepoIds) {
        const state = branchStateByRepoId.get(repoId);
        if (!state || state.isPending || state.isError || state.branches.length === 0) continue;

        const key = String(repoId);
        const current = next[key] ?? [];
        const valid = current.filter((branch) => state.branches.includes(branch));

        if (valid.length > 0) {
          if (valid.length !== current.length) {
            next[key] = valid;
            changed = true;
          }
          initializedBranchReposRef.current.add(repoId);
          continue;
        }

        if (initializedBranchReposRef.current.has(repoId)) continue;

        const repo = repos.find((item) => item.id === repoId);
        next[key] = defaultBranchesForRepo(repo?.default_branch ?? "main", state.branches);
        initializedBranchReposRef.current.add(repoId);
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [open, repos, selectedRepoIds, branchAvailabilityKey]);

  const isDraftValid = useMemo(
    () =>
      addSprintDraftSchema.safeParse({
        repoIds: selectedRepoIds,
        branchesByRepoId,
        rangeStart,
        rangeEnd,
      }).success,
    [selectedRepoIds, branchesByRepoId, rangeStart, rangeEnd],
  );

  const branchesLoading = branchQueries.some((query) => query.isPending);

  const toggleRepo = (id: number) => {
    setSelectedRepoIds((prev) => {
      if (prev.includes(id)) {
        setFormError(null);
        initializedBranchReposRef.current.delete(id);
        setBranchesByRepoId((current) => {
          const next = { ...current };
          delete next[String(id)];
          return next;
        });
        return prev.filter((repoId) => repoId !== id);
      }
      if (prev.length >= MAX_REPOS_PER_SPRINT) {
        setFormError(`You can select at most ${MAX_REPOS_PER_SPRINT} repositories.`);
        return prev;
      }
      const repo = repos?.find((item) => item.id === id);
      if (repo) {
        initializedBranchReposRef.current.delete(id);
        setBranchesByRepoId((current) => ({
          ...current,
          [String(id)]: [repo.default_branch],
        }));
      }
      setFormError(null);
      return [...prev, id];
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = addSprintDraftSchema.safeParse({
      repoIds: selectedRepoIds,
      branchesByRepoId,
      rangeStart,
      rangeEnd,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    if (!repos?.length) {
      setFormError("Repositories are not loaded.");
      return;
    }
    const selected = repos.filter((repo) => parsed.data.repoIds.includes(repo.id));
    if (selected.length !== parsed.data.repoIds.length) {
      setFormError("Could not resolve selected repositories.");
      return;
    }
    setFormError(null);
    const body: CreateSprintPayload = {
      range_start: parsed.data.rangeStart,
      range_end: parsed.data.rangeEnd,
      repos: selected.map((repo) => ({
        owner: repo.owner_login,
        name: repo.name,
        display_name: repo.full_name,
        branches: parsed.data.branchesByRepoId[String(repo.id)],
      })),
    };
    try {
      await onSubmit(body);
    } catch {
      /* Error surfaced via submitError from mutation */
    }
  };

  const submitDisabled =
    isSubmitting || isPending || !!isError || branchesLoading || !isDraftValid;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,720px)] w-full min-w-0 max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="min-w-0 shrink-0 p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Add sprint</DialogTitle>
            <DialogDescription>
              Choose up to {MAX_REPOS_PER_SPRINT} repositories, select one or more branches per
              repo, and set the time range for this sprint.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col">
          <div className="grid min-w-0 grid-cols-1 gap-3 px-6 sm:grid-cols-2">
            <DatePickerField
              id="sprint-range-start"
              label="Start date"
              value={rangeStart}
              maxDate={rangeEnd || undefined}
              onChange={(next) => {
                setRangeStart(next);
                setFormError(null);
              }}
            />
            <DatePickerField
              id="sprint-range-end"
              label="End date"
              value={rangeEnd}
              minDate={rangeStart || undefined}
              onChange={(next) => {
                setRangeEnd(next);
                setFormError(null);
              }}
            />
          </div>

          <p className="mt-3 min-w-0 px-6 text-xs text-muted-foreground">
            Selected {selectedRepoIds.length} / {MAX_REPOS_PER_SPRINT} repositories
          </p>

          <Separator className="mt-3 shrink-0" />

          <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-6">
            <ScrollArea className="h-52 w-full min-w-0 max-w-full sm:h-60">
              <div className="min-w-0 max-w-full py-3 pr-3">
                {isPending && (
                  <p className="py-4 text-center text-sm text-muted-foreground">Loading repos...</p>
                )}

                {isError && (
                  <p className="py-4 text-center text-sm text-destructive">
                    {error instanceof Error ? error.message : "Failed to load repos."}
                  </p>
                )}

                {repos && repos.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No repositories found.
                  </p>
                )}

                {repos && repos.length > 0 && (
                  <ul className="min-w-0 divide-y divide-border">
                    {repos.map((repo) => {
                      const selected = selectedRepoIds.includes(repo.id);
                      const branchState = branchStateByRepoId.get(repo.id);

                      return (
                        <li key={repo.id}>
                          <button
                            type="button"
                            onClick={() => toggleRepo(repo.id)}
                            aria-pressed={selected}
                            className={`flex w-full min-w-0 max-w-full items-start justify-between gap-3 overflow-hidden rounded-md px-1 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none ${
                              selected ? "bg-accent/80 ring-1 ring-border" : "hover:bg-muted/60"
                            }`}
                          >
                            <div className="flex min-w-0 max-w-full flex-1 items-start gap-2 overflow-hidden">
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input bg-background"
                                }`}
                                aria-hidden
                              >
                                {selected ? (
                                  <Check className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                                ) : null}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {repo.full_name}
                                </p>
                                {repo.description ? (
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {repo.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {repo.private ? (
                              <Badge variant="secondary" className="shrink-0 text-[0.65rem]">
                                private
                              </Badge>
                            ) : null}
                          </button>

                          {selected ? (
                            <RepoBranchPicker
                              repoId={repo.id}
                              options={branchState?.branches ?? []}
                              selected={branchesByRepoId[String(repo.id)] ?? []}
                              isPending={branchState?.isPending ?? false}
                              isError={branchState?.isError ?? false}
                              onChange={(branches) => {
                                initializedBranchReposRef.current.add(repo.id);
                                setBranchesByRepoId((prev) => ({
                                  ...prev,
                                  [String(repo.id)]: branches,
                                }));
                                setFormError(null);
                              }}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="shrink-0 border-t bg-muted/40 px-6 py-4">
            {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
            {submitError ? <p className="mb-3 text-sm text-destructive">{submitError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitDisabled}>
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
