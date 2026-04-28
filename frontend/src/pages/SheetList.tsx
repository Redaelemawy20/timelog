import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SheetListSkeleton } from "../components/sheet/SheetListSkeleton";
import { fetchSheets } from "../api/sheets";
import { sheetKeys } from "../lib/sheetQueryKeys";
import { sheetToSummary } from "../lib/sheetSummary";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SheetList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: sheets = [], isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: sheetKeys.list(),
    queryFn: ({ signal }) => fetchSheets(signal),
    select: (rows) => rows.map(sheetToSummary),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sheets;
    return sheets.filter((s) => s.name.toLowerCase().includes(q));
  }, [sheets, query]);

  if (isPending) return <SheetListSkeleton />;

  if (isError) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <Alert variant="destructive" className="items-start">
        <AlertDescription className="pr-24">{message}</AlertDescription>
        <AlertAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/30 bg-background"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            Retry
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  if (!sheets.length) {
    return (
      <Card className="border-dashed py-10 text-center shadow-none">
        <p className="font-medium text-foreground">No sheets yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use <span className="font-medium text-foreground">New sheet</span> in the header to add
          one.
        </p>
      </Card>
    );
  }

  const filterField = (
    <div className="space-y-2">
      <Label htmlFor="sheet-filter" className="text-muted-foreground">
        Filter sheets
      </Label>
      <Input
        id="sheet-filter"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by name…"
        className="max-w-md"
      />
    </div>
  );

  if (!filtered.length) {
    return (
      <div className="space-y-3">
        {filterField}
        <p className="text-sm text-muted-foreground">
          No sheets match &ldquo;{query.trim()}&rdquo;. Try another search.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filterField}

      <Card className="overflow-hidden gap-0 py-0 shadow-sm">
        <ul className="divide-y divide-border">
          {filtered.map((sheet) => (
            <li key={sheet.id}>
              <button
                type="button"
                onClick={() => navigate(`/sheets/${sheet.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-foreground">{sheet.name}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      Updated{" "}
                      {new Date(sheet.updated_at).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </span>
                  </span>
                  {(sheet.repo_count > 0 || sheet.latest_run_summary) && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {sheet.repo_count > 0 ? (
                        <>
                          {sheet.repo_count} {sheet.repo_count === 1 ? "repo" : "repos"}
                        </>
                      ) : null}
                      {sheet.latest_run_summary ? (
                        <>
                          {sheet.repo_count > 0 ? (
                            <span className="mx-1.5 text-border" aria-hidden>
                              ·
                            </span>
                          ) : null}
                          Latest run: {sheet.latest_run_summary}
                        </>
                      ) : null}
                    </span>
                  )}
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
