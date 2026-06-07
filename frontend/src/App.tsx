import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { createClient } from "./api/clients";
import { ClientNameDialog } from "./components/clients/ClientNameDialog";
import { AppHeader } from "./components/layout/AppHeader";
import { CreateSheetDialog } from "./components/sheet/CreateSheetDialog";
import { useGithubTokenStatus } from "./hooks/useGithubTokenStatus";
import { clientKeys } from "./lib/clientQueryKeys";
import { dashboardKeys } from "./lib/dashboardQueryKeys";
import ClientsPage from "./pages/ClientsPage";
import Dashboard from "./pages/Dashboard";
import SheetDetail from "./pages/SheetDetail";
import SheetsPage from "./pages/SheetsPage";

export default function App() {
  const queryClient = useQueryClient();
  const tokenStatus = useGithubTokenStatus();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [addClientError, setAddClientError] = useState<string | null>(null);

  const addClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      setAddClientOpen(false);
      setAddClientError(null);
    },
    onError: (err: unknown) => {
      setAddClientError(err instanceof Error ? err.message : String(err));
    },
  });

  const handleAddClient = (name: string) => {
    if (!name) {
      setAddClientError("Enter a client name.");
      return;
    }
    setAddClientError(null);
    addClientMutation.mutate(name);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader tokenStatus={tokenStatus} />

      <CreateSheetDialog open={createSheetOpen} onClose={() => setCreateSheetOpen(false)} />

      <ClientNameDialog
        open={addClientOpen}
        title="Add client"
        description="Create a client or company to group related sheets."
        submitLabel="Create"
        submitting={addClientMutation.isPending}
        error={addClientError}
        onClose={() => {
          if (!addClientMutation.isPending) {
            setAddClientOpen(false);
            setAddClientError(null);
          }
        }}
        onSubmit={handleAddClient}
      />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                onAddClient={() => setAddClientOpen(true)}
                onAddSheet={() => setCreateSheetOpen(true)}
              />
            }
          />
          <Route path="/clients" element={<ClientsPage onAddClient={() => setAddClientOpen(true)} />} />
          <Route path="/sheets" element={<SheetsPage onAddSheet={() => setCreateSheetOpen(true)} />} />
          <Route path="/sheets/:sheetId" element={<SheetDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
