import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppHeader } from "./components/layout/AppHeader";
import { CreateSheetDialog } from "./components/sheet/CreateSheetDialog";
import { useGithubTokenStatus } from "./hooks/useGithubTokenStatus";
import SheetList from "./pages/SheetList";
import SheetDetail from "./pages/SheetDetail";

export default function App() {
  const navigate = useNavigate();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const tokenStatus = useGithubTokenStatus();

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader
        tokenStatus={tokenStatus}
        onNavigateHome={() => navigate("/")}
        onNewSheet={() => setCreateSheetOpen(true)}
      />
      <CreateSheetDialog open={createSheetOpen} onClose={() => setCreateSheetOpen(false)} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Routes>
          <Route
            path="/"
            element={
              <section aria-labelledby="sheets-heading">
                <h2 id="sheets-heading" className="text-lg font-semibold tracking-tight text-foreground">
                  Sheets
                </h2>
                <p className="mt-1 mb-6 max-w-2xl text-sm text-muted-foreground">
                  Each sheet groups repositories and log entry runs for a workspace or initiative.
                </p>
                <SheetList />
              </section>
            }
          />
          <Route path="/sheets/:sheetId" element={<SheetDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
