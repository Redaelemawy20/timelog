import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  alertOnly?: boolean;
  submitting?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  alertOnly = false,
  submitting = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
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
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {alertOnly ? (
            <Button type="button" onClick={onClose} disabled={submitting}>
              OK
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={destructive ? "destructive" : "default"}
                onClick={onConfirm}
                disabled={submitting}
              >
                {submitting ? "Deleting…" : confirmLabel}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
