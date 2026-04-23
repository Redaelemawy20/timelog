import { useState } from "react";
import SheetList from "./pages/SheetList";
import SheetDetail from "./pages/SheetDetail";

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1
          className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setSelectedId(null)}
        >
          Time Log
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {selectedId === null ? (
          <>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Sheets</h2>
            <SheetList onSelect={setSelectedId} />
          </>
        ) : (
          <SheetDetail sheetId={selectedId} onBack={() => setSelectedId(null)} />
        )}
      </main>
    </div>
  );
}
