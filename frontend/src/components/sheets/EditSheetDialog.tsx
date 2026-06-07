import { useEffect, useState, type FormEvent } from "react";
import type { Client, Sheet } from "../../types/sheet";
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
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "dark:bg-input/30",
);

interface EditSheetDialogProps {
  open: boolean;
  sheet: Sheet | null;
  clients: Client[];
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: { name: string; client_id: number }) => void;
}

export function EditSheetDialog({
  open,
  sheet,
  clients,
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: EditSheetDialogProps) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    if (!open || !sheet) return;
    setName(sheet.name);
    setClientId(String(sheet.client.id));
  }, [open, sheet]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !clientId) return;
    onSubmit({ name: trimmed, client_id: Number(clientId) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>Edit sheet</DialogTitle>
          <DialogDescription>Update the sheet name or move it to another client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-sheet-name">Sheet name</Label>
            <Input
              id="edit-sheet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              autoComplete="off"
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-sheet-client">Client</Label>
            <select
              id="edit-sheet-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={submitting || clients.length === 0}
              className={selectClassName}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !clientId}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
