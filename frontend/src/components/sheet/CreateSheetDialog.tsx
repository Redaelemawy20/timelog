import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createSheet } from "../../api/sheets";
import { sheetKeys } from "../../lib/sheetQueryKeys";

interface CreateSheetDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSheetDialog({ open, onClose }: CreateSheetDialogProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !createMutation.isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, createMutation.isPending]);

  if (!open) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={() => !submitting && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg border border-gray-200"
      >
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          New sheet
        </h2>
        <p className="mt-1 text-sm text-gray-500">Choose a name for this workspace or initiative.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="create-sheet-name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              ref={inputRef}
              id="create-sheet-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              autoComplete="off"
              disabled={submitting}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="e.g. Q1 client work"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
