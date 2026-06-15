"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <div className="glass-panel max-w-2xl w-full p-8 rounded-2xl border border-destructive/50 shadow-lg">
        <h2 className="text-2xl font-bold text-destructive mb-4">Client-Side Error Details</h2>
        <p className="mb-4">Please take a screenshot of this error and send it to the developer:</p>
        
        <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-sm font-mono whitespace-pre-wrap mb-6">
          <div className="text-red-400 font-bold mb-2">{error.name}: {error.message}</div>
          <div className="text-muted-foreground">{error.stack}</div>
        </div>

        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try to recover
        </button>
      </div>
    </div>
  );
}
