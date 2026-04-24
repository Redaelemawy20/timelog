import type { GithubTokenStatus } from "../../types/github";
import { tokenChipLabel, tokenTooltip } from "../../lib/githubTokenDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  tokenStatus: GithubTokenStatus | null;
  onNavigateHome: () => void;
  onNewSheet: () => void;
}

export function AppHeader({ tokenStatus, onNavigateHome, onNewSheet }: AppHeaderProps) {
  const tokenOk = tokenStatus?.phase === "success";

  return (
    <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg px-2 py-1.5 text-left sm:flex-none"
          onClick={onNavigateHome}
        >
          <span className="text-xl font-bold tracking-tight text-foreground">Time Log</span>
          <span className="max-w-md text-sm font-normal text-muted-foreground">
            Pick a sheet to see repos and time log runs.
          </span>
        </Button>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:self-start sm:gap-3">
          <Button type="button" onClick={onNewSheet}>
            New sheet
          </Button>
          {tokenStatus ? (
            <Badge
              variant="outline"
              title={tokenTooltip(tokenStatus)}
              className={
                tokenOk
                  ? "shrink-0 font-normal text-muted-foreground"
                  : "shrink-0 border-amber-200 bg-amber-50 font-normal text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              }
            >
              {tokenChipLabel(tokenStatus)}
            </Badge>
          ) : null}
        </div>
      </div>
    </header>
  );
}
