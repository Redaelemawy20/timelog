import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createSheet } from "../../api/sheets";
import { sheetKeys } from "../../lib/sheetQueryKeys";
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

interface CreateSheetDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSheetDialog({ open, onClose }: CreateSheetDialogProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createSheet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sheetKeys.all });
      onClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    },
  });

  useEffect(() => {
    if (!open) return;
    setName("");
    setError(null);
    createMutation.reset();
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  const submitting = createMutation.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a sheet name.");
      return;
    }
    setError(null);
    createMutation.mutate(trimmed);
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
          <DialogTitle>New sheet</DialogTitle>
          <DialogDescription>
            Choose a name for this workspace or initiative.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-sheet-name">Name</Label>
            <Input
              ref={inputRef}
              id="create-sheet-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              autoComplete="off"
              disabled={submitting}
              placeholder="e.g. Q1 client work"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
