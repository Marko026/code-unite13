"use client";

import { errorLogger, ErrorType } from "@/lib/utils/errorLogger";
import { useEffect, useState } from "react";

interface ErrorDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ErrorDashboard({ isVisible, onClose }: ErrorDashboardProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<ErrorType, number>>(
    {} as Record<ErrorType, number>,
  );
  const [selectedType, setSelectedType] = useState<ErrorType | "ALL">("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isVisible) {
      refreshData();
    }
  }, [isVisible, refreshKey]);

  const refreshData = () => {
    setLogs(errorLogger.getRecentLogs(50));
    setStats(errorLogger.getErrorStats());
  };

  const filteredLogs =
    selectedType === "ALL"
      ? logs
      : logs.filter((log) => log.errorType === selectedType);

  const handleClearLogs = () => {
    errorLogger.clearLogs();
    setRefreshKey((prev) => prev + 1);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getErrorTypeColor = (errorType: ErrorType) => {
    const colors: Record<ErrorType, string> = {
      QUOTA_EXCEEDED: "bg-red-100 text-red-800",
      CORS_ERROR: "bg-orange-100 text-orange-800",
      API_ERROR: "bg-yellow-100 text-yellow-800",
      TINYMCE_ERROR: "bg-blue-100 text-blue-800",
      REACT_ERROR: "bg-purple-100 text-purple-800",
      NETWORK_ERROR: "bg-indigo-100 text-indigo-800",
      VALIDATION_ERROR: "bg-green-100 text-green-800",
      UNKNOWN_ERROR: "bg-gray-100 text-gray-800",
    };
    return colors[errorType] || "bg-gray-100 text-gray-800";
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gray-50 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Error Dashboard (Development)
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={handleClearLogs}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
            >
              Clear Logs
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-4rem)]">
          {/* Sidebar - Stats */}
          <div className="w-64 overflow-y-auto border-r bg-gray-50 p-4">
            <h3 className="mb-3 font-medium text-gray-900">Error Statistics</h3>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedType("ALL")}
                className={`w-full rounded px-3 py-2 text-left text-sm ${
                  selectedType === "ALL"
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-gray-100"
                }`}
              >
                All Errors ({logs.length})
              </button>

              {Object.entries(stats).map(
                ([type, count]) =>
                  count > 0 && (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type as ErrorType)}
                      className={`w-full rounded px-3 py-2 text-left text-sm ${
                        selectedType === type
                          ? getErrorTypeColor(type as ErrorType)
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {type.replace("_", " ")} ({count})
                    </button>
                  ),
              )}
            </div>
          </div>

          {/* Main Content - Logs */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="mb-3 font-medium text-gray-900">
                Recent Logs {selectedType !== "ALL" && `(${selectedType})`}
              </h3>

              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No errors logged yet
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log, index) => (
                    <div key={index} className="rounded-lg border bg-white p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-1 text-xs font-medium ${getErrorTypeColor(log.errorType)}`}
                          >
                            {log.errorType}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </div>

                      <p className="mb-2 text-sm text-gray-900">
                        {log.message}
                      </p>

                      {log.url && (
                        <p className="mb-1 text-xs text-gray-500">
                          <strong>URL:</strong> {log.url}
                        </p>
                      )}

                      {log.stackTrace && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                            Stack Trace
                          </summary>
                          <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                            {log.stackTrace}
                          </pre>
                        </details>
                      )}

                      {log.additionalData && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                            Additional Data
                          </summary>
                          <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                            {JSON.stringify(log.additionalData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to toggle error dashboard (development only)
export function useErrorDashboard() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + E to toggle error dashboard
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "E"
      ) {
        event.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    if (process.env.NODE_ENV === "development") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, []);

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible((prev) => !prev),
  };
}
