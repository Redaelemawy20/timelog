import { NavLink } from "react-router-dom";
import type { GithubTokenStatus } from "../../types/github";
import { tokenChipLabel, tokenTooltip } from "../../lib/githubTokenDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  tokenStatus: GithubTokenStatus | null;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );

export function AppHeader({ tokenStatus }: AppHeaderProps) {
  const tokenOk = tokenStatus?.phase === "success";

  return (
    <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <NavLink to="/" className="block rounded-lg px-1 py-0.5">
              <span className="text-xl font-bold tracking-tight text-foreground">Time Log</span>
            </NavLink>
            <p className="mt-0.5 max-w-md text-sm text-muted-foreground">
              Manage clients, sheets, and sprint time logs.
            </p>
          </div>
          {tokenStatus ? (
            <Badge
              variant="outline"
              title={tokenTooltip(tokenStatus)}
              className={
                tokenOk
                  ? "shrink-0 self-start font-normal text-muted-foreground"
                  : "shrink-0 self-start border-amber-200 bg-amber-50 font-normal text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              }
            >
              {tokenChipLabel(tokenStatus)}
            </Badge>
          ) : null}
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Main">
          <NavLink to="/" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/clients" className={navLinkClass}>
            Clients
          </NavLink>
          <NavLink to="/sheets" className={navLinkClass}>
            Sheets
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

interface PageHeaderProps {
  id?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ id, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 id={id} className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center shadow-none">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  variant = "ghost",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "outline" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={variant === "destructive" ? "outline" : variant}
      size="icon-sm"
      className={variant === "destructive" ? "text-destructive hover:bg-destructive/10" : undefined}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
