import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient, fetchClients } from "../../api/clients";
import { createSheet } from "../../api/sheets";
import { clientKeys } from "../../lib/clientQueryKeys";
import { dashboardKeys } from "../../lib/dashboardQueryKeys";
import { sheetKeys } from "../../lib/sheetQueryKeys";
import { monthNames, suggestedSheetName } from "../../lib/sheetNaming";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CreateSheetDialogProps {
  open: boolean;
  onClose: () => void;
}

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "dark:bg-input/30",
);

export function CreateSheetDialog({ open, onClose }: CreateSheetDialogProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const newClientInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const clientsQuery = useQuery({
    queryKey: clientKeys.list(),
    queryFn: ({ signal }) => fetchClients(signal),
    enabled: open,
    retry: false,
  });

  const clients = clientsQuery.isSuccess ? (clientsQuery.data ?? []) : [];
  const selectedClient = clients.find((client) => String(client.id) === clientId);
  const displayedName = name ?? (selectedClient ? suggestedSheetName(selectedClient) : "");

  const saveClientMutation = useMutation({
    mutationFn: (clientName: string) => createClient({ name: clientName }),
    onSuccess: (client) => {
      setClientId(String(client.id));
      setAddClientOpen(false);
      setNewClientName("");
      setClientError(null);
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onError: (err: unknown) => {
      setClientError(err instanceof Error ? err.message : String(err));
    },
  });

  const createMutation = useMutation({
    mutationFn: createSheet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sheetKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      onClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    },
  });

  useEffect(() => {
    if (!open) return;
    setName(null);
    setMonthPickerOpen(false);
    setClientId("");
    setAddClientOpen(false);
    setNewClientName("");
    setError(null);
    setClientError(null);
    createMutation.reset();
    saveClientMutation.reset();
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open || clientsQuery.isPending || !clientsQuery.isSuccess) return;
    if (clients.length === 0) {
      setClientId("");
      return;
    }
    const stillValid = clientId && clients.some((c) => String(c.id) === clientId);
    if (!stillValid) {
      setClientId(String(clients[0].id));
    }
  }, [open, clientsQuery.isPending, clientsQuery.isSuccess, clients, clientId]);

  useEffect(() => {
    if (!addClientOpen) return;
    queueMicrotask(() => newClientInputRef.current?.focus());
  }, [addClientOpen]);

  const submitting = createMutation.isPending;
  const savingClient = saveClientMutation.isPending;
  const busy = submitting || savingClient;
  const hasClient = Boolean(clientId);
  const clientsUnavailable = clientsQuery.isError;

  const handleSaveClient = () => {
    const trimmed = newClientName.trim();
    if (!trimmed) {
      setClientError("Enter a client name.");
      return;
    }
    setClientError(null);
    saveClientMutation.mutate(trimmed);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = displayedName.trim();
    if (!trimmed) {
      setError("Enter a sheet name.");
      return;
    }
    if (!clientId) {
      setError("Add a client before creating a sheet.");
      return;
    }
    setError(null);
    createMutation.mutate({ name: name === null ? undefined : trimmed, client_id: Number(clientId) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>New sheet</DialogTitle>
          <DialogDescription>
            Assign this sheet to a client or company, then choose a name for the project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-sheet-client">Client</Label>
            {clientsQuery.isPending ? (
              <p className="text-sm text-muted-foreground">Loading clients…</p>
            ) : addClientOpen ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <Input
                  ref={newClientInputRef}
                  id="create-sheet-client"
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  maxLength={255}
                  autoComplete="off"
                  disabled={busy}
                  placeholder="e.g. Acme Corp"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveClient();
                    }
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" disabled={busy} onClick={handleSaveClient}>
                    {savingClient ? "Saving…" : "Save client"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => {
                      setAddClientOpen(false);
                      setNewClientName("");
                      setClientError(null);
                      saveClientMutation.reset();
                    }}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                </div>
                {clientError ? <p className="text-sm text-destructive">{clientError}</p> : null}
              </div>
            ) : clients.length > 0 ? (
              <div className="space-y-2">
                <select
                  id="create-sheet-client"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setName(null);
                  }}
                  disabled={busy}
                  className={selectClassName}
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => {
                    setAddClientOpen(true);
                    setClientError(null);
                  }}
                  disabled={busy}
                >
                  Add client
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {clientsUnavailable ? "Could not load clients." : "No clients yet."}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => {
                    setAddClientOpen(true);
                    setClientError(null);
                  }}
                  disabled={busy}
                >
                  Add client
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="create-sheet-name">Sheet name</Label>
              <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
                <PopoverTrigger
                  type="button"
                  disabled={busy}
                  className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 disabled:opacity-50"
                >
                  Fill month
                </PopoverTrigger>
                <PopoverContent align="end" className="grid w-64 grid-cols-3 gap-1" aria-label="Choose a month">
                  {monthNames.map((month) => (
                    <button
                      key={month}
                      type="button"
                      className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                      onClick={() => {
                        setName(month);
                        setMonthPickerOpen(false);
                        inputRef.current?.focus();
                      }}
                    >
                      {month}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <Input
              ref={inputRef}
              id="create-sheet-name"
              type="text"
              value={displayedName}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              autoComplete="off"
              disabled={busy}
              placeholder="e.g. Q1 platform work"
            />
            {selectedClient?.sheet_naming_pattern !== "manual" ? (
              <p className="text-xs text-muted-foreground">Suggested from this client's naming pattern. You can edit it.</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => !busy && onClose()}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || clientsQuery.isPending || !hasClient}>
              {submitting ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
