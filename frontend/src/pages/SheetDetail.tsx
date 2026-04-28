import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { createSprint, fetchSheet } from "../api/sheets";
import { AddSprintDialog } from "../components/sheet/AddSprintDialog";
import { SprintDetailDialog } from "../components/sheet/SprintDetailDialog";
import { sheetKeys } from "../lib/sheetQueryKeys";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreateSprintPayload, Sprint } from "../types/sheet";

interface Props {
  sheetId: number;
  onBack: () => void;
}

export default function SheetDetail({ sheetId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [addSprintOpen, setAddSprintOpen] = useState(false);
  const [detailSprint, setDetailSprint] = useState<Sprint | null>(null);
  const createRun = useMutation({
    mutationFn: (body: CreateSprintPayload) => createSprint(sheetId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sheetKeys.detail(sheetId) });
      setAddSprintOpen(false);
    },
  });

  useEffect(() => {
    if (addSprintOpen) createRun.reset();
  }, [addSprintOpen]);

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
        <Button type="button" variant="ghost" size="sm" className="gap-1 px-0" onClick={onBack}>
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
      <Button type="button" variant="ghost" size="sm" className="mb-4 gap-1 px-0" onClick={onBack}>
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
          <Button type="button" size="sm" onClick={() => setAddSprintOpen(true)}>
            Add sprint
          </Button>
        </div>
        {sheet.sprints.length ? (
          <div className="space-y-4">
            {sheet.sprints.map((sprint) => (
              <Card key={sprint.id} size="sm" className="shadow-sm">
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {sprint.range_start} → {sprint.range_end}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailSprint(sprint)}
                      >
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
                  {sprint.summary.trim() ? (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {sprint.summary}
                    </p>
                  ) : null}
                  <p className="text-sm text-foreground">Hours: {sprint.time_hours ?? "—"}</p>
                  {sprint.sprint_repos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="pb-2 pr-4 font-medium">Project</th>
                            <th className="pb-2 font-medium">Commit preview</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sprint.sprint_repos.map((entry) => {
                            const commitPreview = entry.commit_messages.split("\n")[0]?.trim() || "";
                            return (
                              <tr key={entry.id} className="border-b border-border/60 last:border-0">
                                <td className="py-2 pr-4 text-foreground">{entry.project}</td>
                                <td className="max-w-md py-2 text-muted-foreground">
                                  <span className="line-clamp-3 whitespace-pre-wrap wrap-break-word">
                                    {commitPreview || "—"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No sprints yet.</p>
        )}
      </section>
    </div>
  );
}
