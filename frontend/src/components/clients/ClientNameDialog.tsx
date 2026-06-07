import { useEffect, useRef, useState, type FormEvent } from "react";
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

interface ClientNameDialogProps {
  open: boolean;
  title: string;
  description: string;
  initialName?: string;
  submitLabel: string;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function ClientNameDialog({
  open,
  title,
  description,
  initialName = "",
  submitLabel,
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: ClientNameDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    queueMicrotask(() => inputRef.current?.focus());
  }, [open, initialName]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(name.trim());
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="client-name">Name</Label>
            <Input
              ref={inputRef}
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              autoComplete="off"
              disabled={submitting}
              placeholder="e.g. Acme Corp"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
