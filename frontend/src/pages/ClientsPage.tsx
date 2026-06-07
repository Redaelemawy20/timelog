import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteClient, fetchClients, updateClient } from "../api/clients";
import { ClientNameDialog } from "../components/clients/ClientNameDialog";
import { EmptyState, IconButton, PageHeader, TableShell } from "../components/layout/AppHeader";
import { clientKeys } from "../lib/clientQueryKeys";
import { dashboardKeys } from "../lib/dashboardQueryKeys";
import type { Client } from "../types/sheet";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsPageProps {
  onAddClient: () => void;
}

export default function ClientsPage({ onAddClient }: ClientsPageProps) {
  const queryClient = useQueryClient();
  const [renameTarget, setRenameTarget] = useState<Client | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [blockedDeleteMessage, setBlockedDeleteMessage] = useState<string | null>(null);

  const clientsQuery = useQuery({
    queryKey: clientKeys.list(),
    queryFn: ({ signal }) => fetchClients(signal),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateClient(id, name),
    onSuccess: () => {
      invalidateAll();
      setRenameTarget(null);
      setDialogError(null);
    },
    onError: (err: unknown) => {
      setDialogError(err instanceof Error ? err.message : String(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: invalidateAll,
  });

  const clients = clientsQuery.data ?? [];

  const handleRenameSubmit = (name: string) => {
    if (!renameTarget) return;
    if (!name) {
      setDialogError("Enter a client name.");
      return;
    }
    setDialogError(null);
    renameMutation.mutate({ id: renameTarget.id, name });
  };

  const handleDelete = (client: Client) => {
    const count = client.sheet_count ?? 0;
    if (count > 0) {
      setBlockedDeleteMessage(
        `Remove or reassign ${count} ${count === 1 ? "sheet" : "sheets"} before deleting "${client.name}".`,
      );
      return;
    }
    setDeleteTarget(client);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <section aria-labelledby="clients-heading">
      <PageHeader
        id="clients-heading"
        title="Clients"
        description="Companies and clients that own your sheets."
        action={
          <Button type="button" onClick={onAddClient}>
            Add client
          </Button>
        }
      />

      {clientsQuery.isError ? (
        <Alert variant="destructive" className="mb-4 items-start">
          <AlertDescription className="pr-24">
            {clientsQuery.error instanceof Error
              ? clientsQuery.error.message
              : "Failed to load clients."}
          </AlertDescription>
          <AlertAction>
            <Button type="button" variant="outline" size="sm" onClick={() => void clientsQuery.refetch()}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {clientsQuery.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description='Click "Add client" to create your first client or company.'
        />
      ) : (
        <TableShell>
          <table className="w-full min-w-130 text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Sheets</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.sheet_count ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(client.updated_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        label={`Rename ${client.name}`}
                        onClick={() => {
                          setDialogError(null);
                          setRenameTarget(client);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </IconButton>
                      <IconButton
                        label={`Delete ${client.name}`}
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(client)}
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

      <ClientNameDialog
        open={renameTarget !== null}
        title="Rename client"
        description="Update the client or company name."
        initialName={renameTarget?.name ?? ""}
        submitLabel="Save"
        submitting={renameMutation.isPending}
        error={dialogError}
        onClose={() => {
          if (!renameMutation.isPending) {
            setRenameTarget(null);
            setDialogError(null);
          }
        }}
        onSubmit={handleRenameSubmit}
      />

      <ConfirmDialog
        open={blockedDeleteMessage !== null}
        title="Cannot delete client"
        description={blockedDeleteMessage ?? ""}
        alertOnly
        onClose={() => setBlockedDeleteMessage(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete client"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        submitting={deleteMutation.isPending}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
