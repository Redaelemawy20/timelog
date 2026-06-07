import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchClients } from "../api/clients";
import { deleteSheet, fetchSheets, updateSheet } from "../api/sheets";
import { EditSheetDialog } from "../components/sheets/EditSheetDialog";
import { EmptyState, IconButton, PageHeader, TableShell } from "../components/layout/AppHeader";
import { clientKeys } from "../lib/clientQueryKeys";
import { dashboardKeys } from "../lib/dashboardQueryKeys";
import { sheetKeys } from "../lib/sheetQueryKeys";
import type { Sheet } from "../types/sheet";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface SheetsPageProps {
  onAddSheet: () => void;
}

export default function SheetsPage({ onAddSheet }: SheetsPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [editTarget, setEditTarget] = useState<Sheet | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const sheetsQuery = useQuery({
    queryKey: sheetKeys.list(),
    queryFn: ({ signal }) => fetchSheets(signal),
  });

  const clientsQuery = useQuery({
    queryKey: clientKeys.list(),
    queryFn: ({ signal }) => fetchClients(signal),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: sheetKeys.all });
    void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };

  const editMutation = useMutation({
    mutationFn: ({ id, name, client_id }: { id: number; name: string; client_id: number }) =>
      updateSheet(id, { name, client_id }),
    onSuccess: () => {
      invalidateAll();
      setEditTarget(null);
      setDialogError(null);
    },
    onError: (err: unknown) => {
      setDialogError(err instanceof Error ? err.message : String(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSheet,
    onSuccess: invalidateAll,
  });

  const sheets = sheetsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sheets;
    return sheets.filter(
      (sheet) =>
        sheet.name.toLowerCase().includes(q) ||
        sheet.client.name.toLowerCase().includes(q),
    );
  }, [sheets, query]);

  const handleDelete = (sheet: Sheet) => {
    if (!window.confirm(`Delete sheet "${sheet.name}" and all its sprints?`)) return;
    deleteMutation.mutate(sheet.id);
  };

  return (
    <section aria-labelledby="sheets-heading">
      <PageHeader
        id="sheets-heading"
        title="Sheets"
        description="Manage project sheets, assign clients, and open sprints."
        action={
          <Button type="button" onClick={onAddSheet}>
            Add sheet
          </Button>
        }
      />

      <div className="mb-4 space-y-2">
        <Label htmlFor="sheet-mgmt-filter" className="text-muted-foreground">
          Filter sheets
        </Label>
        <Input
          id="sheet-mgmt-filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by sheet or client…"
          className="max-w-md"
        />
      </div>

      {sheetsQuery.isError ? (
        <Alert variant="destructive" className="mb-4 items-start">
          <AlertDescription className="pr-24">
            {sheetsQuery.error instanceof Error
              ? sheetsQuery.error.message
              : "Failed to load sheets."}
          </AlertDescription>
          <AlertAction>
            <Button type="button" variant="outline" size="sm" onClick={() => void sheetsQuery.refetch()}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {sheetsQuery.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : sheets.length === 0 ? (
        <EmptyState
          title="No sheets yet"
          description='Click "Add sheet" to create a sheet under a client.'
        />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sheets match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <TableShell>
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Sheet</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sheet) => (
                <tr key={sheet.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{sheet.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sheet.client.name}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(sheet.updated_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        label={`Open ${sheet.name}`}
                        onClick={() => navigate(`/sheets/${sheet.id}`)}
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                      </IconButton>
                      <IconButton
                        label={`Edit ${sheet.name}`}
                        onClick={() => {
                          setDialogError(null);
                          setEditTarget(sheet);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </IconButton>
                      <IconButton
                        label={`Delete ${sheet.name}`}
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(sheet)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      <EditSheetDialog
        open={editTarget !== null}
        sheet={editTarget}
        clients={clients}
        submitting={editMutation.isPending}
        error={dialogError}
        onClose={() => {
          if (!editMutation.isPending) {
            setEditTarget(null);
            setDialogError(null);
          }
        }}
        onSubmit={({ name, client_id }) => {
          if (!editTarget) return;
          editMutation.mutate({ id: editTarget.id, name, client_id });
        }}
      />
    </section>
  );
}
