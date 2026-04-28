import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LogEntry, LogEntryRun, StoredCommit } from "../../types/sheet";

interface Props {
  open: boolean;
  onClose: () => void;
  sheetName: string;
  run: LogEntryRun | null;
}

function formatCommitDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortSha(sha: string | undefined): string {
  if (!sha || typeof sha !== "string") return "—";
  const s = sha.trim();
  return s.length >= 7 ? s.slice(0, 7) : s;
}

function commitsForTable(entry: LogEntry): StoredCommit[] {
  const raw = entry.raw_commits_json;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.filter((c): c is StoredCommit => c != null && typeof c === "object");
  }
  if (entry.commit_messages.trim()) {
    return [
      {
        sha: undefined,
        date: undefined,
        message: entry.commit_messages.trim(),
      },
    ];
  }
  return [];
}

export function LogEntryRunDetailDialog({ open, onClose, sheetName, run }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className="grid max-h-[min(90vh,720px)] w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="shrink-0 border-b px-6 py-4">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="pr-8">Run details</DialogTitle>
            <DialogDescription className="space-y-2 text-left">
              <span className="block font-medium text-foreground">{sheetName}</span>
              {run ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">
                    {run.range_start} → {run.range_end}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      run.status === "saved"
                        ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200"
                        : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                    }
                  >
                    {run.status}
                  </Badge>
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6">
          <div className="py-4 pr-1">
            {!run ? (
              <p className="text-sm text-muted-foreground">No run selected.</p>
            ) : run.log_entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No repositories in this run.</p>
            ) : (
              <div className="space-y-6">
                {run.log_entries.map((entry, idx) => {
                  const label =
                    entry.repo.display_name ?? `${entry.repo.owner}/${entry.repo.name}`;
                  const rows = commitsForTable(entry);
                  return (
                    <section key={entry.id}>
                      {idx > 0 ? <Separator className="mb-6" /> : null}
                      <h4 className="mb-3 text-sm font-semibold text-foreground">{label}</h4>
                      {rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No commits in range.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-md border border-border">
                          <table className="w-full min-w-[520px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                                <th className="px-3 py-2 font-medium whitespace-nowrap">Date</th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">SHA</th>
                                <th className="px-3 py-2 font-medium">Message</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((c, i) => (
                                <tr
                                  key={`${entry.id}-${c.sha ?? i}-${i}`}
                                  className="border-b border-border/60 last:border-0"
                                >
                                  <td className="px-3 py-2 align-top font-mono text-xs text-muted-foreground whitespace-nowrap">
                                    {formatCommitDate(c.date)}
                                  </td>
                                  <td className="px-3 py-2 align-top font-mono text-xs whitespace-nowrap">
                                    {shortSha(c.sha)}
                                  </td>
                                  <td className="max-w-md px-3 py-2 align-top whitespace-pre-wrap wrap-break-word">
                                    {c.message?.trim() || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t px-6 py-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
