import { useState } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { CreateSheetDialog } from "./components/sheet/CreateSheetDialog";
import { useGithubTokenStatus } from "./hooks/useGithubTokenStatus";
import SheetList from "./pages/SheetList";
import SheetDetail from "./pages/SheetDetail";

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const tokenStatus = useGithubTokenStatus();

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader
        tokenStatus={tokenStatus}
        onNavigateHome={() => setSelectedId(null)}
        onNewSheet={() => setCreateSheetOpen(true)}
      />
      <CreateSheetDialog open={createSheetOpen} onClose={() => setCreateSheetOpen(false)} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        {selectedId === null ? (
          <section aria-labelledby="sheets-heading">
            <h2 id="sheets-heading" className="text-lg font-semibold tracking-tight text-foreground">
              Sheets
            </h2>
            <p className="mt-1 mb-6 max-w-2xl text-sm text-muted-foreground">
              Each sheet groups repositories and log entry runs for a workspace or initiative.
            </p>
            <SheetList onSelect={setSelectedId} />
          </section>
        ) : (
          <SheetDetail sheetId={selectedId} onBack={() => setSelectedId(null)} />
        )}
      </main>
    </div>
  );
}
