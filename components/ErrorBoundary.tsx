import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

declare global {
  interface Window {
    analytics?: {
      track: (event: string, properties?: any) => void;
    };
  }
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
      console.error('🚨 Global error:', event.error);
      
      try {
        if (typeof window !== 'undefined' && window.analytics?.track) {
          window.analytics.track('app_crash', {
            error: event.message,
            stack: event.error?.stack?.substring(0, 500)
          });
        }
      } catch {
        // Silent fail
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(event.reason));
      console.error('🚨 Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 p-8">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">💥</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-4 tracking-tight">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            The app encountered an unexpected error. Don't worry - your data is safe.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-2xl transition-all hover:bg-indigo-700 active:scale-95"
            >
              Reload App
            </button>
            <button 
              onClick={() => {
                setHasError(false);
                setError(null);
              }} 
              className="w-full px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all hover:bg-slate-300 active:scale-95"
            >
              Try Again
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-slate-400 cursor-pointer">Error Details</summary>
              <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-32 bg-red-50 p-2 rounded">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};