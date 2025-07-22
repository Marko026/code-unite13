import {
  FetchOptions,
  FetchResponse,
  fetchWithErrorTracking,
} from "./fetchWithErrorTracking";
import { CircuitBreakerOptions, RetryOptions } from "./retryMechanism";

interface APIClientOptions {
  baseURL?: string;
  defaultTimeout?: number;
  defaultRetries?: number;
  defaultHeaders?: Record<string, string>;
  useAdvancedRetry?: boolean;
  circuitBreakerOptions?: CircuitBreakerOptions;
  retryOptions?: RetryOptions;
}

interface APIRequestOptions extends Omit<FetchOptions, "method"> {
  endpoint: string;
  data?: any;
  params?: Record<string, string>;
}

export class APIClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultHeaders: Record<string, string>;
  private useAdvancedRetry: boolean;
  private circuitBreakerOptions: CircuitBreakerOptions;
  private retryOptions: RetryOptions;

  constructor(options: APIClientOptions = {}) {
    this.baseURL = options.baseURL || "";
    this.defaultTimeout = options.defaultTimeout || 10000;
    this.defaultRetries = options.defaultRetries || 3;
    this.defaultHeaders = options.defaultHeaders || {};
    this.useAdvancedRetry = options.useAdvancedRetry ?? true;
    this.circuitBreakerOptions = options.circuitBreakerOptions || {
      failureThreshold: 5,
      resetTimeout: 60000,
    };
    this.retryOptions = options.retryOptions || {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
    };
  }

  private buildURL(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseURL || window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  private getCircuitBreakerKey(method: string, endpoint: string): string {
    return `api_${method.toLowerCase()}_${endpoint.replace(/[^a-zA-Z0-9]/g, "_")}`;
  }

  private async makeRequest<T>(
    method: string,
    options: APIRequestOptions,
  ): Promise<FetchResponse<T>> {
    const {
      endpoint,
      data,
      params,
      headers = {},
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      circuitBreakerKey,
      retryOptions,
      circuitBreakerOptions,
      ...fetchOptions
    } = options;

    const url = this.buildURL(endpoint, params);
    const breakerKey =
      circuitBreakerKey || this.getCircuitBreakerKey(method, endpoint);

    const requestOptions: FetchOptions = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      timeout,
      retries,
      useAdvancedRetry: this.useAdvancedRetry,
      circuitBreakerKey: breakerKey,
      retryOptions: { ...this.retryOptions, ...retryOptions },
      circuitBreakerOptions: {
        ...this.circuitBreakerOptions,
        ...circuitBreakerOptions,
      },
      ...fetchOptions,
    };

    // Add body for methods that support it
    if (data && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      if (
        data instanceof FormData ||
        data instanceof Blob ||
        typeof data === "string"
      ) {
        requestOptions.body = data;
      } else {
        requestOptions.body = JSON.stringify(data);
        requestOptions.headers = {
          "Content-Type": "application/json",
          ...requestOptions.headers,
        };
      }
    }

    return fetchWithErrorTracking<T>(url, requestOptions);
  }

  async get<T = any>(
    options: Omit<APIRequestOptions, "data">,
  ): Promise<FetchResponse<T>> {
    return this.makeRequest<T>("GET", options);
  }

  async post<T = any>(options: APIRequestOptions): Promise<FetchResponse<T>> {
    return this.makeRequest<T>("POST", options);
  }

  async put<T = any>(options: APIRequestOptions): Promise<FetchResponse<T>> {
    return this.makeRequest<T>("PUT", options);
  }

  async patch<T = any>(options: APIRequestOptions): Promise<FetchResponse<T>> {
    return this.makeRequest<T>("PATCH", options);
  }

  async delete<T = any>(
    options: Omit<APIRequestOptions, "data">,
  ): Promise<FetchResponse<T>> {
    return this.makeRequest<T>("DELETE", options);
  }
}

// Create default API client instance
export const apiClient = new APIClient({
  useAdvancedRetry: true,
  defaultTimeout: 30000,
  defaultRetries: 3,
  circuitBreakerOptions: {
    failureThreshold: 5,
    resetTimeout: 60000,
  },
  retryOptions: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
});

// Convenience functions for common API patterns
export const chatGPTAPI = {
  generateAnswer: async (question: string) => {
    return apiClient.post<{ success: boolean; reply?: string; error?: string }>(
      {
        endpoint: "/api/chatgpt",
        data: { question },
        circuitBreakerKey: "chatgpt_api",
        timeout: 30000,
        retryOptions: {
          maxRetries: 3,
          baseDelay: 2000, // Longer delay for AI API
          maxDelay: 15000,
        },
      },
    );
  },
};

export default apiClient;
