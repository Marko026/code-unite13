"use client";

import { useErrorTracking } from "@/lib/hooks/useErrorTracking";
import { ErrorType } from "@/lib/utils/errorLogger";
import { createContext, ReactNode, useContext } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface ErrorContextType {
  trackError: (
    errorType: ErrorType,
    message: string,
    error?: Error,
    additionalData?: Record<string, any>,
  ) => void;
  trackAPIError: (
    endpoint: string,
    method: string,
    error: Error,
    statusCode?: number,
    requestData?: any,
    responseData?: any,
  ) => void;
  trackNetworkError: (
    url: string,
    error: Error,
    additionalData?: Record<string, any>,
  ) => void;
  trackValidationError: (
    field: string,
    value: any,
    validationRule: string,
    additionalData?: Record<string, any>,
  ) => void;
  getRecentLogs: (count?: number) => any[];
  getErrorStats: () => Record<ErrorType, number>;
  clearLogs: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface GlobalErrorProviderProps {
  children: ReactNode;
  enableGlobalHandlers?: boolean;
}

export function GlobalErrorProvider({
  children,
  enableGlobalHandlers = true,
}: GlobalErrorProviderProps) {
  const errorTracking = useErrorTracking({
    enableGlobalErrorHandler: enableGlobalHandlers,
    enableUnhandledRejectionHandler: enableGlobalHandlers,
    enableResourceErrorHandler: enableGlobalHandlers,
  });

  return (
    <ErrorContext.Provider value={errorTracking}>
      <ErrorBoundary
        componentName="GlobalErrorBoundary"
        fallback={
          <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-4 text-center">
                <svg
                  className="mx-auto size-16 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h1 className="mb-4 text-center text-xl font-bold text-gray-900">
                Application Error
              </h1>

              <p className="mb-6 text-center text-gray-600">
                We&apos;re sorry, but something went wrong. Please refresh the
                page or try again later.
              </p>

              <div className="flex justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        }
      >
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
}

export function useGlobalError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useGlobalError must be used within a GlobalErrorProvider");
  }
  return context;
}
