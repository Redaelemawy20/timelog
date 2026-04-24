import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { fetchSheet } from "../api/sheets";
import { AddLogEntryRunDialog } from "../components/sheet/AddLogEntryRunDialog";
import { sheetKeys } from "../lib/sheetQueryKeys";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  sheetId: number;
  onBack: () => void;
}

export default function SheetDetail({ sheetId, onBack }: Props) {
  const [addRunOpen, setAddRunOpen] = useState(false);
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
      <AddLogEntryRunDialog open={addRunOpen} onClose={() => setAddRunOpen(false)} />
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
            Log entry runs
          </h3>
          <Button type="button" size="sm" onClick={() => setAddRunOpen(true)}>
            Add run
          </Button>
        </div>
        {sheet.log_entry_runs.length ? (
          <div className="space-y-4">
            {sheet.log_entry_runs.map((run) => (
              <Card key={run.id} size="sm" className="shadow-sm">
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
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
                  </div>
                  {run.log_entries.length > 0 ? (
                    <div>
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="pb-2 pr-4 font-medium">Project</th>
                            <th className="pb-2 pr-4 font-medium">Task</th>
                            <th className="pb-2 font-medium">Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {run.log_entries.map((entry) => (
                            <tr key={entry.id} className="border-b border-border/60 last:border-0">
                              <td className="py-2 pr-4 text-foreground">{entry.project}</td>
                              <td className="py-2 pr-4 text-muted-foreground">{entry.task || "—"}</td>
                              <td className="py-2 text-foreground">{entry.time_hours ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
        )}
      </section>
    </div>
  );
}
