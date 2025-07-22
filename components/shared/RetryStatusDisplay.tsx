"use client";

import { formatErrorForUser } from "@/lib/utils/errorMessages";
import {
  CircuitBreakerState,
  globalRetryMechanism,
} from "@/lib/utils/retryMechanism";
import { useEffect, useState } from "react";

interface RetryStatusDisplayProps {
  circuitBreakerKey?: string;
  error?: Error | null;
  isRetrying?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const RetryStatusDisplay = ({
  circuitBreakerKey,
  error,
  isRetrying = false,
  onRetry,
  className = "",
}: RetryStatusDisplayProps) => {
  const [circuitBreakerStats, setCircuitBreakerStats] = useState<any>(null);

  useEffect(() => {
    if (circuitBreakerKey) {
      const stats =
        globalRetryMechanism.getCircuitBreakerStats(circuitBreakerKey);
      setCircuitBreakerStats(stats);

      // Update stats periodically
      const interval = setInterval(() => {
        const updatedStats =
          globalRetryMechanism.getCircuitBreakerStats(circuitBreakerKey);
        setCircuitBreakerStats(updatedStats);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [circuitBreakerKey]);

  if (!error && !circuitBreakerStats) {
    return null;
  }

  const errorInfo = error ? formatErrorForUser(error) : null;
  const isCircuitBreakerOpen =
    circuitBreakerStats?.state === CircuitBreakerState.OPEN;
  const isCircuitBreakerHalfOpen =
    circuitBreakerStats?.state === CircuitBreakerState.HALF_OPEN;

  return (
    <div className={`rounded-md p-4 text-sm ${className}`}>
      {/* Circuit Breaker Status */}
      {circuitBreakerStats && (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`mr-2 size-2 rounded-full ${
                  isCircuitBreakerOpen
                    ? "bg-red-500"
                    : isCircuitBreakerHalfOpen
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
              />
              <span className="font-medium">
                Service Status: {circuitBreakerStats.state}
              </span>
            </div>
            {circuitBreakerStats.failureCount > 0 && (
              <span className="text-xs opacity-75">
                Failures: {circuitBreakerStats.failureCount}
              </span>
            )}
          </div>

          {isCircuitBreakerOpen && (
            <div className="mt-2 text-xs opacity-75">
              Service temporarily unavailable. Will retry automatically in{" "}
              {Math.max(
                0,
                Math.ceil(
                  (circuitBreakerStats.lastFailureTime + 60000 - Date.now()) /
                    1000,
                ),
              )}{" "}
              seconds.
            </div>
          )}

          {isCircuitBreakerHalfOpen && (
            <div className="mt-2 text-xs opacity-75">
              Testing service recovery... ({circuitBreakerStats.successCount}/3
              successes needed)
            </div>
          )}
        </div>
      )}

      {/* Error Information */}
      {errorInfo && (
        <div>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{errorInfo.title}</p>
              <p className="mt-1">{errorInfo.message}</p>
              {errorInfo.actionable && (
                <p className="mt-2 text-xs opacity-75">
                  {errorInfo.actionable}
                </p>
              )}
            </div>
            <div
              className={`ml-2 rounded px-2 py-1 text-xs ${
                errorInfo.severity === "critical"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                  : errorInfo.severity === "high"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200"
                    : errorInfo.severity === "medium"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
              }`}
            >
              {errorInfo.severity}
            </div>
          </div>

          {/* Retry Button */}
          {errorInfo.canRetry &&
            onRetry &&
            !isRetrying &&
            !isCircuitBreakerOpen && (
              <button
                onClick={onRetry}
                className="mt-3 rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                disabled={isRetrying}
              >
                {isRetrying ? "Retrying..." : "Try Again"}
              </button>
            )}

          {/* Retrying Status */}
          {isRetrying && (
            <div className="mt-3 flex items-center text-xs">
              <div className="mr-2 size-3 animate-spin rounded-full border border-blue-500 border-t-transparent" />
              <span>Retrying with smart backoff...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetryStatusDisplay;
