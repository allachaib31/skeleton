import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
                <h1 className="text-4xl font-bold text-primary">tafa3olcard</h1>
                <p className="text-secondary">Vite + React + TS + Tailwind 4 + Zod</p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                    Get Started
                  </button>
                  <button className="px-4 py-2 border border-secondary text-secondary rounded-md hover:bg-secondary/10 transition-colors">
                    Documentation
                  </button>
                </div>
              </div>
            } />
          </Routes>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;
