import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createSprint, deleteSprint, exportSheetExcel, fetchSheet, updateSprint } from "../api/sheets";
import { AddSprintDialog } from "../components/sheet/AddSprintDialog";
import { SprintCard } from "../components/sheet/SprintCard";
import { SprintChatPanel } from "../components/sheet/SprintChatPanel";
import { SprintDetailDialog } from "../components/sheet/SprintDetailDialog";
import { sheetKeys } from "../lib/sheetQueryKeys";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreateSprintPayload, Sprint } from "../types/sheet";
export default function SheetDetail() {
  const params = useParams<{ sheetId: string }>();
  const navigate = useNavigate();
  const parsedId = Number(params.sheetId);
  const sheetId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const queryClient = useQueryClient();
  const [addSprintOpen, setAddSprintOpen] = useState(false);
  const [detailSprint, setDetailSprint] = useState<Sprint | null>(null);
  const [chatSprint, setChatSprint] = useState<Sprint | null>(null);
  const [summaryDraftInjection, setSummaryDraftInjection] = useState<{
    sprintId: number;
    text: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (sheetId === null) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 px-0"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sheets
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Invalid sheet route</AlertTitle>
          <AlertDescription>Sheet id is missing or invalid.</AlertDescription>
        </Alert>
      </div>
    );
  }
  const createRun = useMutation({
    mutationFn: (body: CreateSprintPayload) => createSprint(sheetId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sheetKeys.detail(sheetId) });
      setAddSprintOpen(false);
    },
  });
  const updateSprintRun = useMutation({
    mutationFn: ({
      sprintId,
      patch,
    }: {
      sprintId: number;
      patch: { summary?: string; time_hours?: string | null };
    }) => updateSprint(sheetId, sprintId, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sheetKeys.detail(sheetId) });
    },
  });

  const deleteSprintRun = useMutation({
    mutationFn: (sprintId: number) => deleteSprint(sheetId, sprintId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sheetKeys.detail(sheetId) });
    },
  });

  useEffect(() => {
    if (addSprintOpen) createRun.reset();
  }, [addSprintOpen]);

  const handleExport = async () => {
    if (!sheetId) return;
    setIsExporting(true);
    setExportError(null);
    try {
      await exportSheetExcel(sheetId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const { data: sheet, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: sheetKeys.detail(sheetId),
    queryFn: () => fetchSheet(sheetId),
  });

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 px-0"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sheets
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!sheet) return null;

  return (
    <div>
      {chatSprint ? (
        <SprintChatPanel
          sprint={chatSprint}
          onClose={() => setChatSprint(null)}
          onUseSummary={(text) => {
            setSummaryDraftInjection({ sprintId: chatSprint.id, text });
            setChatSprint(null);
          }}
        />
      ) : null}
      <SprintDetailDialog
        open={detailSprint !== null}
        onClose={() => setDetailSprint(null)}
        sheetName={sheet.name}
        sprint={detailSprint}
      />
      <AddSprintDialog
        open={addSprintOpen}
        onClose={() => {
          if (!createRun.isPending) setAddSprintOpen(false);
        }}
        isSubmitting={createRun.isPending}
        submitError={
          createRun.error instanceof Error ? createRun.error.message : null
        }
        onSubmit={(body) => createRun.mutateAsync(body)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-4 gap-1 px-0"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to sheets
      </Button>

      <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">{sheet.name}</h2>

      <section className="mb-8">
        <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Repos
        </h3>
        {sheet.repos.length ? (
          <ul className="space-y-1.5 text-sm text-foreground">
            {sheet.repos.map((r) => (
              <li key={r.id}>{r.display_name ?? `${r.owner}/${r.name}`}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No repos linked.</p>
        )}
      </section>

      <Separator className="mb-8" />

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Sprints
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleExport()}
              disabled={isExporting || sheet.sprints.length === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="size-4" aria-hidden />
                  Export XLS
                </>
              )}
            </Button>
            <Button type="button" size="sm" onClick={() => setAddSprintOpen(true)}>
              Add sprint
            </Button>
          </div>
        </div>
        {exportError ? (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        ) : null}
        {sheet.sprints.length ? (
          <div className="space-y-4">
            {sheet.sprints.map((sprint) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                onDetails={(item) => setDetailSprint(item)}
                onOpenChat={(item) => setChatSprint(item)}
                appliedSummaryDraft={
                  summaryDraftInjection?.sprintId === sprint.id
                    ? summaryDraftInjection.text
                    : null
                }
                onAppliedSummaryDraftConsumed={() => setSummaryDraftInjection(null)}
                onUpdateSprint={(sprintId, patch) =>
                  updateSprintRun.mutateAsync({ sprintId, patch })
                }
                onDeleteSprint={(sprintId) => deleteSprintRun.mutateAsync(sprintId)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No sprints yet.</p>
        )}
      </section>
    </div>
  );
}
