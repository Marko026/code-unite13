import { ErrorInfo } from "react";

export type ErrorType =
  | "QUOTA_EXCEEDED"
  | "CORS_ERROR"
  | "API_ERROR"
  | "TINYMCE_ERROR"
  | "REACT_ERROR"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export interface ErrorLog {
  timestamp: Date;
  errorType: ErrorType;
  message: string;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  componentStack?: string;
  additionalData?: Record<string, any>;
}

export interface APIErrorDetails {
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestData?: any;
  responseData?: any;
}

export interface ReactErrorDetails {
  componentStack?: string;
  errorBoundary?: string;
  props?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log a general error
   */
  public logError(
    errorType: ErrorType,
    message: string,
    error?: Error,
    additionalData?: Record<string, any>,
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      errorType,
      message,
      stackTrace: error?.stack,
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      additionalData,
    };

    this.addLog(errorLog);
    this.consoleLog(errorLog);

    // In production, you might want to send to external service
    if (process.env.NODE_ENV === "production") {
      this.sendToExternalService(errorLog);
    }
  }

  /**
   * Log API-specific errors
   */
  public logAPIError(
    message: string,
    error: Error,
    apiDetails: APIErrorDetails,
  ): void {
    this.logError("API_ERROR", message, error, {
      api: apiDetails,
    });
  }

  /**
   * Log React component errors
   */
  public logReactError(
    error: Error,
    errorInfo: ErrorInfo,
    componentName?: string,
  ): void {
    this.logError("REACT_ERROR", error.message, error, {
      react: {
        componentStack: errorInfo.componentStack,
        errorBoundary: componentName,
      },
    });
  }

  /**
   * Log TinyMCE specific errors
   */
  public logTinyMCEError(
    message: string,
    error?: Error,
    editorConfig?: any,
  ): void {
    this.logError("TINYMCE_ERROR", message, error, {
      tinymce: {
        config: editorConfig,
      },
    });
  }

  /**
   * Log quota exceeded errors
   */
  public logQuotaError(
    message: string,
    storageType: "localStorage" | "sessionStorage" | "indexedDB",
    error?: Error,
  ): void {
    this.logError("QUOTA_EXCEEDED", message, error, {
      storage: {
        type: storageType,
        usage: this.getStorageUsage(),
      },
    });
  }

  /**
   * Log CORS errors
   */
  public logCORSError(
    message: string,
    url: string,
    method: string,
    error?: Error,
  ): void {
    this.logError("CORS_ERROR", message, error, {
      cors: {
        url,
        method,
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  }

  /**
   * Get recent error logs
   */
  public getRecentLogs(count: number = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by error type
   */
  public getLogsByType(errorType: ErrorType): ErrorLog[] {
    return this.logs.filter((log) => log.errorType === errorType);
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      QUOTA_EXCEEDED: 0,
      CORS_ERROR: 0,
      API_ERROR: 0,
      TINYMCE_ERROR: 0,
      REACT_ERROR: 0,
      NETWORK_ERROR: 0,
      VALIDATION_ERROR: 0,
      UNKNOWN_ERROR: 0,
    };

    this.logs.forEach((log) => {
      stats[log.errorType]++;
    });

    return stats;
  }

  private addLog(errorLog: ErrorLog): void {
    this.logs.push(errorLog);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private consoleLog(errorLog: ErrorLog): void {
    const logLevel = this.getLogLevel(errorLog.errorType);
    const logMessage = `[${errorLog.errorType}] ${errorLog.message}`;

    switch (logLevel) {
      case "error":
        console.error(logMessage, errorLog);
        break;
      case "warn":
        console.warn(logMessage, errorLog);
        break;
      default:
        console.log(logMessage, errorLog);
    }
  }

  private getLogLevel(errorType: ErrorType): "error" | "warn" | "info" {
    const errorLevels: Record<ErrorType, "error" | "warn" | "info"> = {
      QUOTA_EXCEEDED: "error",
      CORS_ERROR: "error",
      API_ERROR: "error",
      TINYMCE_ERROR: "warn",
      REACT_ERROR: "error",
      NETWORK_ERROR: "warn",
      VALIDATION_ERROR: "warn",
      UNKNOWN_ERROR: "error",
    };

    return errorLevels[errorType];
  }

  private getStorageUsage(): Record<string, number> {
    if (typeof window === "undefined") return {};

    try {
      const usage: Record<string, number> = {};

      // Calculate localStorage usage
      let localStorageSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length + key.length;
        }
      }
      usage.localStorage = localStorageSize;

      // Calculate sessionStorage usage
      let sessionStorageSize = 0;
      for (const key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          sessionStorageSize += sessionStorage[key].length + key.length;
        }
      }
      usage.sessionStorage = sessionStorageSize;

      return usage;
    } catch (error) {
      return {};
    }
  }

  private async sendToExternalService(errorLog: ErrorLog): Promise<void> {
    try {
      // In a real application, you would send to services like:
      // - Sentry
      // - LogRocket
      // - Datadog
      // - Custom logging endpoint

      // For now, we'll just store in localStorage as a fallback
      const existingLogs = localStorage.getItem("error_logs");
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);

      // Keep only last 50 logs in localStorage
      const recentLogs = logs.slice(-50);
      localStorage.setItem("error_logs", JSON.stringify(recentLogs));
    } catch (error) {
      // If we can't even log to localStorage, just console.error
      console.error("Failed to persist error log:", error);
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Convenience functions for common error types
export const logError = (
  errorType: ErrorType,
  message: string,
  error?: Error,
  additionalData?: Record<string, any>,
) => errorLogger.logError(errorType, message, error, additionalData);

export const logAPIError = (
  message: string,
  error: Error,
  apiDetails: APIErrorDetails,
) => errorLogger.logAPIError(message, error, apiDetails);

export const logReactError = (
  error: Error,
  errorInfo: ErrorInfo,
  componentName?: string,
) => errorLogger.logReactError(error, errorInfo, componentName);

export const logTinyMCEError = (
  message: string,
  error?: Error,
  editorConfig?: any,
) => errorLogger.logTinyMCEError(message, error, editorConfig);

export const logQuotaError = (
  message: string,
  storageType: "localStorage" | "sessionStorage" | "indexedDB",
  error?: Error,
) => errorLogger.logQuotaError(message, storageType, error);

export const logCORSError = (
  message: string,
  url: string,
  method: string,
  error?: Error,
) => errorLogger.logCORSError(message, url, method, error);
