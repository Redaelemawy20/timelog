import { useQuery } from "@tanstack/react-query";
import { Building2, FileSpreadsheet, Layers, Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchDashboardStats } from "../api/dashboard";
import { PageHeader } from "../components/layout/AppHeader";
import { dashboardKeys } from "../lib/dashboardQueryKeys";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardProps {
  onAddClient: () => void;
  onAddSheet: () => void;
}

export default function Dashboard({ onAddClient, onAddSheet }: DashboardProps) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: ({ signal }) => fetchDashboardStats(signal),
  });

  return (
    <section aria-labelledby="dashboard-heading">
      <PageHeader
        id="dashboard-heading"
        title="Dashboard"
        description="Overview of your clients, sheets, and sprints."
      />

      {isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load dashboard stats."}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Clients"
          value={data?.client_count}
          loading={isPending}
          icon={<Building2 className="size-4 text-muted-foreground" aria-hidden />}
        />
        <StatCard
          title="Sheets"
          value={data?.sheet_count}
          loading={isPending}
          icon={<FileSpreadsheet className="size-4 text-muted-foreground" aria-hidden />}
        />
        <StatCard
          title="Sprints"
          value={data?.sprint_count}
          loading={isPending}
          icon={<Layers className="size-4 text-muted-foreground" aria-hidden />}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 pt-4 sm:grid-cols-2">
          <Button type="button" variant="outline" className="justify-start gap-2" onClick={onAddClient}>
            <Plus className="size-4" aria-hidden />
            Add client
          </Button>
          <Button type="button" variant="outline" className="justify-start gap-2" onClick={onAddSheet}>
            <Plus className="size-4" aria-hidden />
            Add sheet
          </Button>
          <Link
            to="/clients"
            className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-2")}
          >
            <Users className="size-4" aria-hidden />
            Manage clients
          </Link>
          <Link
            to="/sheets"
            className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-2")}
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            Manage sheets
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

function StatCard({
  title,
  value,
  loading,
  icon,
}: {
  title: string;
  value?: number;
  loading: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
