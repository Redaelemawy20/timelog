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
  initialRemainingHours?: number;
  submitLabel: string;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: { name: string; remaining_hours: number }) => void;
}

export function ClientNameDialog({
  open,
  title,
  description,
  initialName = "",
  initialRemainingHours = 0,
  submitLabel,
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: ClientNameDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [remainingHours, setRemainingHours] = useState(String(initialRemainingHours));

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setRemainingHours(String(initialRemainingHours));
    queueMicrotask(() => inputRef.current?.focus());
  }, [open, initialName, initialRemainingHours]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), remaining_hours: parseFloat(remainingHours) || 0 });
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
          <div className="grid gap-2">
            <Label htmlFor="client-remaining-hours">Remaining hours (unpaid)</Label>
            <Input
              id="client-remaining-hours"
              type="number"
              step="0.5"
              min="0"
              value={remainingHours}
              onChange={(e) => setRemainingHours(e.target.value)}
              disabled={submitting}
              placeholder="0"
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
