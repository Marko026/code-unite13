export interface ErrorMessageConfig {
  title: string;
  message: string;
  actionable?: string;
  retryable?: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

export const ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {
  // Network and Connection Errors
  NETWORK_ERROR: {
    title: "Connection Problem",
    message:
      "Unable to connect to the server. Please check your internet connection.",
    actionable: "Try refreshing the page or check your network connection.",
    retryable: true,
    severity: "medium",
  },

  TIMEOUT: {
    title: "Request Timeout",
    message: "The request took too long to complete.",
    actionable: "The server might be busy. Please try again in a moment.",
    retryable: true,
    severity: "medium",
  },

  CONNECTION_ERROR: {
    title: "Connection Failed",
    message: "Failed to establish connection with the server.",
    actionable: "Please check your internet connection and try again.",
    retryable: true,
    severity: "medium",
  },

  // CORS Errors
  CORS_ERROR: {
    title: "Access Blocked",
    message: "The request was blocked due to security restrictions.",
    actionable:
      "This appears to be a configuration issue. Please contact support if the problem persists.",
    retryable: false,
    severity: "high",
  },

  // API Errors
  API_ERROR: {
    title: "Service Error",
    message: "The service encountered an unexpected error.",
    actionable: "Please try again. If the problem continues, contact support.",
    retryable: true,
    severity: "medium",
  },

  SERVICE_UNAVAILABLE: {
    title: "Service Temporarily Unavailable",
    message: "The service is currently unavailable.",
    actionable:
      "We're working to restore service. Please try again in a few minutes.",
    retryable: true,
    severity: "high",
  },

  QUOTA_EXCEEDED: {
    title: "Usage Limit Reached",
    message: "You've reached the usage limit for this service.",
    actionable:
      "Please wait before making more requests, or contact support to increase your limit.",
    retryable: false,
    severity: "medium",
  },

  INVALID_API_KEY: {
    title: "Authentication Error",
    message: "The service authentication failed.",
    actionable:
      "This appears to be a configuration issue. Please contact support.",
    retryable: false,
    severity: "critical",
  },

  // Validation Errors
  VALIDATION_ERROR: {
    title: "Invalid Input",
    message: "The provided information is not valid.",
    actionable: "Please check your input and try again.",
    retryable: false,
    severity: "low",
  },

  INVALID_JSON: {
    title: "Data Format Error",
    message: "The data format is not valid.",
    actionable: "Please refresh the page and try again.",
    retryable: false,
    severity: "medium",
  },

  // Circuit Breaker Errors
  CIRCUIT_BREAKER_OPEN: {
    title: "Service Protection Active",
    message: "The service is temporarily protected due to repeated failures.",
    actionable:
      "Please wait a moment before trying again. The service will automatically recover.",
    retryable: true,
    severity: "high",
  },

  // Retry Errors
  RETRY_EXHAUSTED: {
    title: "Multiple Attempts Failed",
    message: "We tried multiple times but couldn't complete your request.",
    actionable:
      "Please try again later or contact support if the problem persists.",
    retryable: true,
    severity: "high",
  },

  // TinyMCE Specific Errors
  TINYMCE_QUOTA_EXCEEDED: {
    title: "Editor Storage Full",
    message: "The editor has reached its storage limit.",
    actionable:
      "Try clearing your browser data or use the simplified editor mode.",
    retryable: false,
    severity: "medium",
  },

  TINYMCE_INIT_ERROR: {
    title: "Editor Loading Failed",
    message: "The rich text editor failed to load properly.",
    actionable:
      "You can still use the basic text editor. Try refreshing to restore the full editor.",
    retryable: true,
    severity: "medium",
  },

  // Generic Fallbacks
  UNKNOWN_ERROR: {
    title: "Unexpected Error",
    message: "Something unexpected happened.",
    actionable: "Please try again. If the problem continues, contact support.",
    retryable: true,
    severity: "medium",
  },

  INTERNAL_ERROR: {
    title: "Internal Error",
    message: "An internal error occurred while processing your request.",
    actionable:
      "Please try again later. If the problem persists, contact support.",
    retryable: true,
    severity: "high",
  },
};

export function getErrorMessage(
  errorCode: string,
  customMessage?: string,
): ErrorMessageConfig {
  const baseMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;

  if (customMessage) {
    return {
      ...baseMessage,
      message: customMessage,
    };
  }

  return baseMessage;
}

export function getErrorMessageFromError(error: Error): ErrorMessageConfig {
  const errorMessage = error.message.toLowerCase();

  // Network and connection errors
  if (errorMessage.includes("timeout") || error.name === "AbortError") {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound")
  ) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (errorMessage.includes("cors")) {
    return ERROR_MESSAGES.CORS_ERROR;
  }

  // API specific errors
  if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
    return ERROR_MESSAGES.QUOTA_EXCEEDED;
  }

  if (
    errorMessage.includes("api key") ||
    errorMessage.includes("unauthorized")
  ) {
    return ERROR_MESSAGES.INVALID_API_KEY;
  }

  if (
    errorMessage.includes("service unavailable") ||
    errorMessage.includes("503")
  ) {
    return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
  }

  if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }

  if (errorMessage.includes("json")) {
    return ERROR_MESSAGES.INVALID_JSON;
  }

  // Circuit breaker
  if (errorMessage.includes("circuit breaker")) {
    return ERROR_MESSAGES.CIRCUIT_BREAKER_OPEN;
  }

  // TinyMCE specific
  if (errorMessage.includes("tinymce") && errorMessage.includes("quota")) {
    return ERROR_MESSAGES.TINYMCE_QUOTA_EXCEEDED;
  }

  if (errorMessage.includes("tinymce")) {
    return ERROR_MESSAGES.TINYMCE_INIT_ERROR;
  }

  // HTTP status codes
  if (
    errorMessage.includes("500") ||
    errorMessage.includes("502") ||
    errorMessage.includes("504")
  ) {
    return ERROR_MESSAGES.INTERNAL_ERROR;
  }

  // Default fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function formatErrorForUser(
  error: Error,
  context?: string,
): {
  title: string;
  message: string;
  actionable?: string;
  canRetry: boolean;
  severity: string;
} {
  const errorConfig = getErrorMessageFromError(error);

  return {
    title: errorConfig.title,
    message: context
      ? `${context}: ${errorConfig.message}`
      : errorConfig.message,
    actionable: errorConfig.actionable,
    canRetry: errorConfig.retryable || false,
    severity: errorConfig.severity,
  };
}

// Helper function to determine if an error should trigger a retry
export function shouldRetryError(error: Error): boolean {
  const errorConfig = getErrorMessageFromError(error);
  return errorConfig.retryable || false;
}

// Helper function to get retry delay based on error type
export function getRetryDelayForError(error: Error, attempt: number): number {
  const errorMessage = error.message.toLowerCase();

  // Longer delays for quota/rate limit errors
  if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
    return Math.min(5000 * Math.pow(2, attempt), 60000); // 5s, 10s, 20s, up to 1min
  }

  // Shorter delays for network errors
  if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
    return Math.min(1000 * Math.pow(1.5, attempt), 10000); // 1s, 1.5s, 2.25s, up to 10s
  }

  // Default exponential backoff
  return Math.min(1000 * Math.pow(2, attempt), 30000); // 1s, 2s, 4s, up to 30s
}
