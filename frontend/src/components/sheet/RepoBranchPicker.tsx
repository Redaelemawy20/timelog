import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepoBranchPickerProps {
  repoId: number;
  options: string[];
  selected: string[];
  isPending: boolean;
  isError: boolean;
  onChange: (branches: string[]) => void;
}

export function RepoBranchPicker({
  repoId,
  options,
  selected,
  isPending,
  isError,
  onChange,
}: RepoBranchPickerProps) {
  const toggleBranch = (branch: string) => {
    if (selected.includes(branch)) {
      if (selected.length === 1) return;
      onChange(selected.filter((name) => name !== branch));
      return;
    }
    onChange([...selected, branch]);
  };

  const groupId = `sprint-repo-branches-${repoId}`;

  return (
    <div
      className="mb-3 ml-6 space-y-1.5 pr-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <p id={groupId} className="text-xs text-muted-foreground">
        Branches
      </p>
      {isPending ? (
        <p className="text-xs text-muted-foreground">Loading branches...</p>
      ) : isError ? (
        <p className="text-xs text-destructive">Failed to load branches.</p>
      ) : options.length > 0 ? (
        <ul
          role="group"
          aria-labelledby={groupId}
          className="max-h-28 space-y-1 overflow-y-auto rounded-md border border-border/70 p-2"
        >
          {options.map((branch) => {
            const isSelected = selected.includes(branch);
            return (
              <li key={branch}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleBranch(branch)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                    isSelected ? "bg-accent/70" : "hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background",
                    )}
                    aria-hidden
                  >
                    {isSelected ? (
                      <Check className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                    ) : null}
                  </span>
                  <span className="truncate">{branch}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No branches found.</p>
      )}
    </div>
  );
}
