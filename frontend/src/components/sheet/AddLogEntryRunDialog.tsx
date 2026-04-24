import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { fetchGithubRepos } from "../../api/github";
import {
  addLogEntryRunDraftSchema,
  MAX_REPOS_PER_LOG_ENTRY_RUN,
  type AddLogEntryRunDraft,
} from "../../lib/addLogEntryRunSchema";
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

interface AddLogEntryRunDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (draft: AddLogEntryRunDraft) => void;
}

export function AddLogEntryRunDialog({ open, onClose, onCreate }: AddLogEntryRunDialogProps) {
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

  const submitDisabled = isPending || !!isError || !isDraftValid;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[min(90vh,720px)] w-full min-w-0 max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="min-w-0 shrink-0 p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Add log entry run</DialogTitle>
            <DialogDescription>
              Choose up to {MAX_REPOS_PER_LOG_ENTRY_RUN} repositories and the time range for this
              run.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col">
          <div className="grid min-w-0 grid-cols-1 gap-3 px-6 sm:grid-cols-2">
            <DatePickerField
              id="log-run-range-start"
              label="Start date"
              value={rangeStart}
              maxDate={rangeEnd || undefined}
              onChange={(next) => {
                setRangeStart(next);
                setFormError(null);
              }}
            />
            <DatePickerField
              id="log-run-range-end"
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
            Selected {selectedRepoIds.length} / {MAX_REPOS_PER_LOG_ENTRY_RUN} repositories
          </p>

          <Separator className="mt-3 shrink-0" />

          <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-6">
            <ScrollArea className="h-52 w-full min-w-0 max-w-full sm:h-60">
              <div className="min-w-0 max-w-full py-3 pr-3">
              {isPending && (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading repos…</p>
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
                    return (
                      <li key={repo.id}>
                        <button
                          type="button"
                          onClick={() => toggleRepo(repo.id)}
                          aria-pressed={selected}
                          className={`flex w-full min-w-0 max-w-full items-start justify-between gap-3 overflow-hidden rounded-md px-1 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none ${
                            selected
                              ? "bg-accent/80 ring-1 ring-border"
                              : "hover:bg-muted/60"
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitDisabled}>
                Create
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
