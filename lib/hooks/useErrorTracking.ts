import { errorLogger, ErrorType } from "@/lib/utils/errorLogger";
import { useCallback, useEffect } from "react";

interface UseErrorTrackingOptions {
  enableGlobalErrorHandler?: boolean;
  enableUnhandledRejectionHandler?: boolean;
  enableResourceErrorHandler?: boolean;
}

export const useErrorTracking = (options: UseErrorTrackingOptions = {}) => {
  const {
    enableGlobalErrorHandler = true,
    enableUnhandledRejectionHandler = true,
    enableResourceErrorHandler = true,
  } = options;

  // Global error handler for uncaught JavaScript errors
  useEffect(() => {
    if (!enableGlobalErrorHandler) return;

    const handleGlobalError = (event: ErrorEvent) => {
      errorLogger.logError(
        "UNKNOWN_ERROR",
        event.message || "Uncaught JavaScript error",
        event.error,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          source: "global-error-handler",
        },
      );
    };

    window.addEventListener("error", handleGlobalError);

    return () => {
      window.removeEventListener("error", handleGlobalError);
    };
  }, [enableGlobalErrorHandler]);

  // Unhandled promise rejection handler
  useEffect(() => {
    if (!enableUnhandledRejectionHandler) return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      errorLogger.logError(
        "UNKNOWN_ERROR",
        "Unhandled promise rejection",
        error,
        {
          reason: event.reason,
          source: "unhandled-rejection-handler",
        },
      );
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [enableUnhandledRejectionHandler]);

  // Resource loading error handler (images, scripts, etc.)
  useEffect(() => {
    if (!enableResourceErrorHandler) return;

    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      const tagName = target?.tagName?.toLowerCase();
      const src = (target as any)?.src || (target as any)?.href;

      errorLogger.logError(
        "NETWORK_ERROR",
        `Failed to load ${tagName} resource`,
        undefined,
        {
          tagName,
          src,
          source: "resource-error-handler",
        },
      );
    };

    // Use capture phase to catch resource loading errors
    window.addEventListener("error", handleResourceError, true);

    return () => {
      window.removeEventListener("error", handleResourceError, true);
    };
  }, [enableResourceErrorHandler]);

  // Utility functions to manually track specific errors
  const trackError = useCallback(
    (
      errorType: ErrorType,
      message: string,
      error?: Error,
      additionalData?: Record<string, any>,
    ) => {
      errorLogger.logError(errorType, message, error, additionalData);
    },
    [],
  );

  const trackAPIError = useCallback(
    (
      endpoint: string,
      method: string,
      error: Error,
      statusCode?: number,
      requestData?: any,
      responseData?: any,
    ) => {
      errorLogger.logAPIError(`API Error: ${method} ${endpoint}`, error, {
        endpoint,
        method,
        statusCode,
        requestData,
        responseData,
      });
    },
    [],
  );

  const trackNetworkError = useCallback(
    (url: string, error: Error, additionalData?: Record<string, any>) => {
      errorLogger.logError("NETWORK_ERROR", `Network error for ${url}`, error, {
        url,
        ...additionalData,
      });
    },
    [],
  );

  const trackValidationError = useCallback(
    (
      field: string,
      value: any,
      validationRule: string,
      additionalData?: Record<string, any>,
    ) => {
      errorLogger.logError(
        "VALIDATION_ERROR",
        `Validation failed for ${field}: ${validationRule}`,
        undefined,
        {
          field,
          value,
          validationRule,
          ...additionalData,
        },
      );
    },
    [],
  );

  return {
    trackError,
    trackAPIError,
    trackNetworkError,
    trackValidationError,
    getRecentLogs: errorLogger.getRecentLogs.bind(errorLogger),
    getErrorStats: errorLogger.getErrorStats.bind(errorLogger),
    clearLogs: errorLogger.clearLogs.bind(errorLogger),
  };
};
