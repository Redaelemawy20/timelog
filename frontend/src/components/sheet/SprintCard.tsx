import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Loader2, MessageSquare, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  formatDayMonth,
  formatTimeHours,
  toHoursAndMinutes,
  toTimeHoursValue,
} from "../../lib/sprintCardFormat";
import type { Sprint } from "../../types/sheet";

interface Props {
  sprint: Sprint;
  onDetails: (sprint: Sprint) => void;
  onOpenChat: (sprint: Sprint) => void;
  appliedSummaryDraft?: string | null;
  onAppliedSummaryDraftConsumed?: () => void;
  onUpdateSprint: (
    sprintId: number,
    patch: {
      summary?: string;
      time_hours?: string | null;
    },
  ) => Promise<void>;
  onDeleteSprint: (sprintId: number) => Promise<void>;
}

export function SprintCard({
  sprint,
  onDetails,
  onOpenChat,
  appliedSummaryDraft,
  onAppliedSummaryDraftConsumed,
  onUpdateSprint,
  onDeleteSprint,
}: Props) {
  const summaryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [summaryValue, setSummaryValue] = useState(sprint.summary);
  const [summaryDraft, setSummaryDraft] = useState(sprint.summary);
  const [timeHoursValue, setTimeHoursValue] = useState<string | null>(sprint.time_hours);
  const [hourDraft, setHourDraft] = useState("");
  const [minuteDraft, setMinuteDraft] = useState("");
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setSummaryValue(sprint.summary);
    setSummaryDraft(sprint.summary);
    setTimeHoursValue(sprint.time_hours);
    const current = toHoursAndMinutes(sprint.time_hours);
    setHourDraft(current.hours ? String(current.hours) : "");
    setMinuteDraft(current.minutes ? String(current.minutes) : "");
    setIsTimeDialogOpen(false);
    setIsEditingSummary(false);
    setIsSaving(false);
    setSummaryError(null);
    setTimeError(null);
    setIsDeleteDialogOpen(false);
    setIsDeleting(false);
    setDeleteError(null);
  }, [sprint.id, sprint.summary, sprint.time_hours]);

  useEffect(() => {
    const textarea = summaryTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [isEditingSummary, summaryDraft, summaryValue]);

  useEffect(() => {
    if (appliedSummaryDraft == null) return;
    setSummaryDraft(appliedSummaryDraft);
    setSummaryError(null);
    setIsEditingSummary(true);
    onAppliedSummaryDraftConsumed?.();
  }, [appliedSummaryDraft, onAppliedSummaryDraftConsumed]);

  const startSummaryEdit = () => {
    setSummaryDraft(summaryValue);
    setSummaryError(null);
    setIsEditingSummary(true);
  };

  const saveSummaryEdit = async () => {
    const nextSummary = summaryDraft.trim();
    setIsSaving(true);
    setSummaryError(null);
    try {
      await onUpdateSprint(sprint.id, { summary: nextSummary });
      setSummaryValue(nextSummary);
      setIsEditingSummary(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save summary";
      setSummaryError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelSummaryEdit = () => {
    setSummaryDraft(summaryValue);
    setIsEditingSummary(false);
  };

  const openTimeDialog = () => {
    const current = toHoursAndMinutes(timeHoursValue);
    setHourDraft(current.hours ? String(current.hours) : "");
    setMinuteDraft(current.minutes ? String(current.minutes) : "");
    setTimeError(null);
    setIsTimeDialogOpen(true);
  };

  const saveTimeEdit = async () => {
    const normalizedHours = hourDraft.trim() === "" ? "0" : hourDraft.trim();
    const normalizedMinutes = minuteDraft.trim() === "" ? "0" : minuteDraft.trim();
    const nextHours = Number.parseInt(normalizedHours, 10);
    const nextMinutes = Number.parseInt(normalizedMinutes, 10);
    if (!Number.isFinite(nextHours) || nextHours < 0) {
      setTimeError("Hours must be 0 or greater.");
      return;
    }
    if (!Number.isFinite(nextMinutes) || nextMinutes < 0 || nextMinutes > 59) {
      setTimeError("Minutes must be between 0 and 59.");
      return;
    }

    setIsSaving(true);
    setTimeError(null);
    try {
      const nextTimeHours = toTimeHoursValue(nextHours, nextMinutes);
      await onUpdateSprint(sprint.id, { time_hours: nextTimeHours });
      setTimeHoursValue(nextTimeHours);
      setIsTimeDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save time";
      setTimeError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteSprint(sprint.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete sprint";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onOpenChat(sprint)}
              aria-label="Open sprint chat"
            >
              <MessageSquare className="size-3.5" aria-hidden />
              Chat
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onDetails(sprint)}>
              Details
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </Button>
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
                <td className="border p-0 align-top">
                  <div className="flex min-h-20 min-w-0 flex-col border border-border bg-muted/20 p-1 focus-within:ring-2 focus-within:ring-ring">
                    <div className="mb-1 flex items-center justify-end gap-1">
                      {isEditingSummary ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="size-6"
                            onClick={() => void saveSummaryEdit()}
                            disabled={isSaving}
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
                            disabled={isSaving}
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
                          disabled={isSaving}
                          aria-label="Edit summary"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                      )}
                    </div>
                    <textarea
                      ref={summaryTextareaRef}
                      value={isEditingSummary ? summaryDraft : summaryValue}
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      readOnly={!isEditingSummary}
                      disabled={isSaving}
                      rows={3}
                      className="w-full resize-none overflow-hidden bg-transparent px-2 py-1 text-center text-sm text-foreground outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 read-only:cursor-default read-only:text-muted-foreground"
                      placeholder="Add sprint summary"
                    />
                    {summaryError ? (
                      <p className="px-2 pb-1 text-xs text-destructive">{summaryError}</p>
                    ) : null}
                  </div>
                </td>
                <td className="border p-0 align-top">
                  <div className="flex h-full min-h-20 min-w-0 flex-col overflow-hidden bg-muted/20 p-1">
                    <div className="mb-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-6"
                        onClick={openTimeDialog}
                        disabled={isSaving}
                        aria-label="Edit time"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                    <div className="flex flex-1 items-center justify-center px-1">
                      <p className="text-center text-sm text-foreground whitespace-nowrap">
                        {formatTimeHours(timeHoursValue)}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit time</DialogTitle>
              <DialogDescription>Enter hours and minutes for this sprint.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Hours</p>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={hourDraft}
                  onChange={(e) => setHourDraft(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Minutes</p>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  value={minuteDraft}
                  onChange={(e) => setMinuteDraft(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            {timeError ? <p className="text-xs text-destructive">{timeError}</p> : null}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTimeDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void saveTimeEdit()} disabled={isSaving}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete sprint</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this sprint ({formatDayMonth(sprint.range_start)} to{" "}
                {formatDayMonth(sprint.range_end)})? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteError ? <p className="text-xs text-destructive">{deleteError}</p> : null}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
