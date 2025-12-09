'use client';

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="p-4">
      <p className="text-red-500 font-bold">Something went wrong:</p>
      <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded">{error.message}</pre>
      <button 
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
