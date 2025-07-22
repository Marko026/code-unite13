import { logAPIError, logCORSError, logError } from "./errorLogger";
import {
  getErrorMessageFromError,
  getRetryDelayForError,
  shouldRetryError,
} from "./errorMessages";
import {
  CircuitBreakerOptions,
  RetryOptions,
  retryWithCircuitBreaker,
} from "./retryMechanism";

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string> | Headers;
  body?: string | FormData | Blob | ArrayBuffer | URLSearchParams | null;
  mode?: "cors" | "no-cors" | "same-origin";
  credentials?: "omit" | "same-origin" | "include";
  cache?:
    | "default"
    | "no-store"
    | "reload"
    | "no-cache"
    | "force-cache"
    | "only-if-cached";
  redirect?: "follow" | "error" | "manual";
  referrer?: string;
  referrerPolicy?:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal | null;
  // Additional options specific to our wrapper
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  trackErrors?: boolean;
  useAdvancedRetry?: boolean;
  circuitBreakerKey?: string;
  retryOptions?: RetryOptions;
  circuitBreakerOptions?: CircuitBreakerOptions;
}

export interface FetchResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status?: number;
  headers?: Headers;
}

class FetchError extends Error {
  public status?: number;
  public response?: Response;
  public data?: any;

  constructor(
    message: string,
    status?: number,
    response?: Response,
    data?: any,
  ) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.response = response;
    this.data = data;
  }
}

export async function fetchWithErrorTracking<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResponse<T>> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    trackErrors = true,
    useAdvancedRetry = true,
    circuitBreakerKey,
    retryOptions,
    circuitBreakerOptions,
    ...fetchOptions
  } = options;

  const method = fetchOptions.method || "GET";

  // Create the core fetch operation
  const fetchOperation = async (): Promise<FetchResponse<T>> => {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }

        const error = new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response,
          errorData,
        );

        // Track specific error types
        if (trackErrors) {
          if (response.status === 0 || response.status >= 500) {
            logError(
              "NETWORK_ERROR",
              `Network error for ${method} ${url}`,
              error,
              {
                method,
                status: response.status,
              },
            );
          } else {
            logAPIError(`API request failed: ${method} ${url}`, error, {
              endpoint: url,
              method,
              statusCode: response.status,
              requestData: fetchOptions.body,
              responseData: errorData,
            });
          }
        }

        // Don't retry client errors (4xx), only server errors (5xx) and network errors
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          return {
            success: false,
            error: error.message,
            status: response.status,
            headers: response.headers,
          };
        }

        throw error;
      }

      // Success - parse response
      let data: T;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else if (contentType?.includes("text/")) {
        data = (await response.text()) as unknown as T;
      } else {
        data = (await response.blob()) as unknown as T;
      }

      return {
        success: true,
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const errorInstance =
        error instanceof Error ? error : new Error(String(error));

      // Track different types of errors
      if (trackErrors) {
        if (error instanceof DOMException && error.name === "AbortError") {
          logError(
            "NETWORK_ERROR",
            `Request timeout for ${method} ${url}`,
            errorInstance,
            {
              method,
              timeout,
              errorType: "timeout",
            },
          );
        } else if (errorInstance.message.includes("CORS")) {
          logCORSError(
            `CORS error for ${method} ${url}`,
            url,
            method,
            errorInstance,
          );
        } else if (errorInstance.message.includes("fetch")) {
          logError(
            "NETWORK_ERROR",
            `Network error for ${method} ${url}`,
            errorInstance,
            {
              method,
              errorType: "network",
            },
          );
        } else {
          logAPIError(`Request failed: ${method} ${url}`, errorInstance, {
            endpoint: url,
            method,
            requestData: fetchOptions.body,
          });
        }
      }

      throw errorInstance;
    }
  };

  // Use advanced retry mechanism if enabled
  if (useAdvancedRetry) {
    try {
      const defaultRetryOptions: RetryOptions = {
        maxRetries: retries,
        baseDelay: retryDelay,
        retryCondition: (error: Error) => shouldRetryError(error),
        onRetry: (error: Error, attempt: number) => {
          if (trackErrors) {
            const errorConfig = getErrorMessageFromError(error);
            logError(
              "API_ERROR",
              `Retrying ${method} ${url} (attempt ${attempt}/${retries + 1}) - ${errorConfig.title}`,
              error,
              {
                method,
                url,
                attempt,
                maxRetries: retries + 1,
                errorType: errorConfig.title,
              },
            );
          }
        },
        ...retryOptions,
      };

      const defaultCircuitBreakerOptions: CircuitBreakerOptions = {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        ...circuitBreakerOptions,
      };

      const operationName = `${method} ${url}`;
      const breakerKey =
        circuitBreakerKey ||
        `fetch_${method}_${url.replace(/[^a-zA-Z0-9]/g, "_")}`;

      return await retryWithCircuitBreaker(
        fetchOperation,
        breakerKey,
        defaultRetryOptions,
        defaultCircuitBreakerOptions,
        operationName,
      );
    } catch (error) {
      const errorInstance =
        error instanceof Error ? error : new Error(String(error));
      return {
        success: false,
        error: errorInstance.message,
      };
    }
  } else {
    // Fallback to simple retry logic
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fetchOperation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this is the last attempt, don't retry
        if (attempt === retries) {
          break;
        }

        // Check if we should retry this error
        if (!shouldRetryError(lastError)) {
          break;
        }

        // Wait before retrying with smart delay
        const delay = getRetryDelayForError(lastError, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    return {
      success: false,
      error: lastError?.message || "Request failed after all retries",
    };
  }
}

// Convenience methods for common HTTP methods
export const get = <T = any>(
  url: string,
  options?: Omit<FetchOptions, "method">,
) =>
  fetchWithErrorTracking<T>(url, {
    ...options,
    method: "GET",
    circuitBreakerKey:
      options?.circuitBreakerKey || `get_${url.replace(/[^a-zA-Z0-9]/g, "_")}`,
  });

export const post = <T = any>(
  url: string,
  data?: any,
  options?: Omit<FetchOptions, "method" | "body">,
) =>
  fetchWithErrorTracking<T>(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    circuitBreakerKey:
      options?.circuitBreakerKey || `post_${url.replace(/[^a-zA-Z0-9]/g, "_")}`,
  });

export const put = <T = any>(
  url: string,
  data?: any,
  options?: Omit<FetchOptions, "method" | "body">,
) =>
  fetchWithErrorTracking<T>(url, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    circuitBreakerKey:
      options?.circuitBreakerKey || `put_${url.replace(/[^a-zA-Z0-9]/g, "_")}`,
  });

export const del = <T = any>(
  url: string,
  options?: Omit<FetchOptions, "method">,
) =>
  fetchWithErrorTracking<T>(url, {
    ...options,
    method: "DELETE",
    circuitBreakerKey:
      options?.circuitBreakerKey ||
      `delete_${url.replace(/[^a-zA-Z0-9]/g, "_")}`,
  });

export const patch = <T = any>(
  url: string,
  data?: any,
  options?: Omit<FetchOptions, "method" | "body">,
) =>
  fetchWithErrorTracking<T>(url, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    circuitBreakerKey:
      options?.circuitBreakerKey ||
      `patch_${url.replace(/[^a-zA-Z0-9]/g, "_")}`,
  });
