import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export default function ErrorBanner({ message, onRetry = null, onDismiss = null }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/50 p-4 sm:p-5 shadow-sm text-rose-900 dark:text-rose-200 my-4 animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">
            Action Required
          </h4>
          <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 mt-0.5 leading-relaxed">
            {message}
          </p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
