import { Check, CheckCircle2, ChevronDown, Copy, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { isSheetInSyncWithPublished } from "../../lib/sheetPublishSync";
import { cn } from "../../lib/utils";
import type { SheetDetail } from "../../types/sheet";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  sheet: SheetDetail;
  isToggling: boolean;
  isRepublishing: boolean;
  publishError: string | null;
  onTogglePublish: (published: boolean) => void;
  onRepublish: () => void;
}

export function SheetShareBar({
  sheet,
  isToggling,
  isRepublishing,
  publishError,
  onTogglePublish,
  onRepublish,
}: Props) {
  const [linkCopied, setLinkCopied] = useState(false);
  const inSync = isSheetInSyncWithPublished(sheet);
  const canPublish = sheet.sprints.length > 0;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/share/${sheet.share_token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={sheet.is_published}
        aria-label="Share sheet with client"
        disabled={isToggling || (!sheet.is_published && !canPublish)}
        onClick={() => onTogglePublish(!sheet.is_published)}
        className="inline-flex items-center gap-2.5 text-sm font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
            sheet.is_published ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
              sheet.is_published ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </span>
        {isToggling ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <span className={sheet.is_published ? "text-foreground" : undefined}>
            {sheet.is_published ? "Shared" : "Share"}
          </span>
        )}
      </button>

      {sheet.is_published ? (
        <div className="flex items-center">
          {/* Copy button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-r-none border-r-0"
            onClick={handleCopyLink}
            disabled={isToggling}
          >
            {linkCopied ? (
              <>
                <Check className="size-4 text-emerald-600" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-muted-foreground" aria-hidden />
                Copy link
              </>
            )}
            {/* sync dot */}
            <span
              className={cn(
                "ml-0.5 size-2 shrink-0 rounded-full",
                inSync ? "bg-emerald-500" : "bg-amber-400",
              )}
            />
          </Button>

          {/* Dropdown chevron */}
          <Popover>
            <PopoverTrigger
              className="inline-flex h-8 items-center justify-center rounded-l-none rounded-r-md border border-input bg-background px-2 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isToggling}
              aria-label="Share options"
            >
              <ChevronDown className="size-3.5" aria-hidden />
            </PopoverTrigger>
            <PopoverContent align="end" side="bottom" className="w-56 p-2">
              {inSync ? (
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                  Shared page is up to date
                </div>
              ) : (
                <div className="p-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={onRepublish}
                    disabled={isRepublishing}
                  >
                    {isRepublishing ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="size-4 shrink-0" aria-hidden />
                    )}
                    Re-publish
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      ) : null}

      {publishError ? <span className="text-xs text-destructive">{publishError}</span> : null}
      {!sheet.is_published && !canPublish ? (
        <span className="text-xs text-muted-foreground">Add a sprint to share</span>
      ) : null}
    </div>
  );
}
