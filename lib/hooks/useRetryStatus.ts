"use client";

import { formatErrorForUser } from "@/lib/utils/errorMessages";
import {
  CircuitBreakerState,
  globalRetryMechanism,
} from "@/lib/utils/retryMechanism";
import { useCallback, useEffect, useState } from "react";

interface RetryStatusHookOptions {
  circuitBreakerKey?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface RetryStatus {
  circuitBreakerStats: any;
  isCircuitBreakerOpen: boolean;
  isCircuitBreakerHalfOpen: boolean;
  canRetry: boolean;
  resetCircuitBreaker: () => void;
  getFormattedError: (error: Error) => ReturnType<typeof formatErrorForUser>;
  getAllCircuitBreakerStats: () => Record<string, any>;
}

export const useRetryStatus = (
  options: RetryStatusHookOptions = {},
): RetryStatus => {
  const {
    circuitBreakerKey,
    autoRefresh = true,
    refreshInterval = 1000,
  } = options;

  const [circuitBreakerStats, setCircuitBreakerStats] = useState<any>(null);

  const updateStats = useCallback(() => {
    if (circuitBreakerKey) {
      const stats =
        globalRetryMechanism.getCircuitBreakerStats(circuitBreakerKey);
      setCircuitBreakerStats(stats);
    }
  }, [circuitBreakerKey]);

  useEffect(() => {
    updateStats();

    if (autoRefresh && circuitBreakerKey) {
      const interval = setInterval(updateStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [updateStats, autoRefresh, refreshInterval, circuitBreakerKey]);

  const resetCircuitBreaker = useCallback(() => {
    if (circuitBreakerKey) {
      globalRetryMechanism.resetCircuitBreaker(circuitBreakerKey);
      updateStats();
    }
  }, [circuitBreakerKey, updateStats]);

  const getFormattedError = useCallback((error: Error) => {
    return formatErrorForUser(error);
  }, []);

  const getAllCircuitBreakerStats = useCallback(() => {
    return globalRetryMechanism.getAllCircuitBreakerStats();
  }, []);

  const isCircuitBreakerOpen =
    circuitBreakerStats?.state === CircuitBreakerState.OPEN;
  const isCircuitBreakerHalfOpen =
    circuitBreakerStats?.state === CircuitBreakerState.HALF_OPEN;
  const canRetry = !isCircuitBreakerOpen;

  return {
    circuitBreakerStats,
    isCircuitBreakerOpen,
    isCircuitBreakerHalfOpen,
    canRetry,
    resetCircuitBreaker,
    getFormattedError,
    getAllCircuitBreakerStats,
  };
};

export default useRetryStatus;
