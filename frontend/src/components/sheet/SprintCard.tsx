import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Sprint } from "../../types/sheet";

interface Props {
  sprint: Sprint;
  onDetails: (sprint: Sprint) => void;
  onSaveSummary: (sprintId: number, summary: string) => Promise<void>;
}

function formatDayMonth(value: string): string {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

export function SprintCard({ sprint, onDetails, onSaveSummary }: Props) {
  const [summaryValue, setSummaryValue] = useState(sprint.summary);
  const [summaryDraft, setSummaryDraft] = useState(sprint.summary);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [saveSummaryError, setSaveSummaryError] = useState<string | null>(null);

  useEffect(() => {
    setSummaryValue(sprint.summary);
    setSummaryDraft(sprint.summary);
    setIsEditingSummary(false);
    setIsSavingSummary(false);
    setSaveSummaryError(null);
  }, [sprint.id, sprint.summary]);

  const startSummaryEdit = () => {
    setSummaryDraft(summaryValue);
    setSaveSummaryError(null);
    setIsEditingSummary(true);
  };

  const saveSummaryEdit = async () => {
    const nextSummary = summaryDraft.trim();
    setIsSavingSummary(true);
    setSaveSummaryError(null);
    try {
      await onSaveSummary(sprint.id, nextSummary);
      setSummaryValue(nextSummary);
      setIsEditingSummary(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save summary";
      setSaveSummaryError(message);
    } finally {
      setIsSavingSummary(false);
    }
  };

  const cancelSummaryEdit = () => {
    setSummaryDraft(summaryValue);
    setIsEditingSummary(false);
  };

  return (
    <Card size="sm" className="shadow-sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {sprint.sprint_repos.length > 0 ? (
              sprint.sprint_repos.map((entry) => (
                <Badge key={entry.id} variant="secondary">
                  {entry.project}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">No project</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onDetails(sprint)}>
              Details
            </Button>
            <Badge
              variant="outline"
              className={
                sprint.status === "saved"
                  ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              }
            >
              {sprint.status}
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-22" />
              <col className="w-22" />
              <col />
              <col className="w-18" />
            </colgroup>
            <thead>
              <tr className="bg-muted/30 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <th className="border border-border px-2 py-2 text-left font-medium whitespace-nowrap">Start date</th>
                <th className="border border-border px-2 py-2 text-left font-medium whitespace-nowrap">End date</th>
                <th className="border border-border px-2 py-2 text-center font-medium">Summary</th>
                <th className="border border-border px-2 py-2 text-right font-medium whitespace-nowrap">Time (hr)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="border border-border px-2 py-2 text-foreground whitespace-nowrap">{formatDayMonth(sprint.range_start)}</td>
                <td className="border border-border px-2 py-2 text-foreground whitespace-nowrap">{formatDayMonth(sprint.range_end)}</td>
                <td className="border  p-0">
                  <div className="min-w-0 overflow-hidden border border-border bg-muted/20 p-1 focus-within:ring-2 focus-within:ring-ring">
            <div className="mb-1 flex justify-end gap-1">
                      {isEditingSummary ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="size-6"
                    onClick={() => void saveSummaryEdit()}
                    disabled={isSavingSummary}
                            aria-label="Save summary"
                          >
                            <Check className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="size-6"
                            onClick={cancelSummaryEdit}
                    disabled={isSavingSummary}
                            aria-label="Cancel summary edit"
                          >
                            <X className="size-3.5" aria-hidden />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          onClick={startSummaryEdit}
                  disabled={isSavingSummary}
                          aria-label="Edit summary"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                      )}
                    </div>
                    <textarea
                      value={isEditingSummary ? summaryDraft : summaryValue}
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      readOnly={!isEditingSummary}
              disabled={isSavingSummary}
                      className="min-h-20 w-full resize-y bg-transparent px-2 py-1 text-center text-sm text-foreground outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 read-only:cursor-default read-only:text-muted-foreground"
                      placeholder="Add sprint summary"
                    />
            {saveSummaryError ? (
              <p className="px-2 pb-1 text-xs text-destructive">{saveSummaryError}</p>
            ) : null}
                  </div>
                </td>
                <td className="border border-border px-2 py-2 text-right text-foreground whitespace-nowrap">{sprint.time_hours ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
