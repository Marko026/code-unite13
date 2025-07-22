import { logError } from "./errorLogger";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}
// eslint-disable-next-line no-unused-vars

export enum CircuitBreakerState {
  // eslint-disable-next-line no-unused-vars
  CLOSED = "CLOSED",
  // eslint-disable-next-line no-unused-vars
  OPEN = "OPEN",
  // eslint-disable-next-line no-unused-vars
  HALF_OPEN = "HALF_OPEN",
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly _monitoringPeriod: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 60000; // 1 minute
    this._monitoringPeriod = options.monitoringPeriod ?? 300000; // 5 minutes
  }

  async execute<T>(
    operation: () => Promise<T>,
    operationName?: string,
  ): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error(
          `Circuit breaker is OPEN for ${operationName || "operation"}. Service temporarily unavailable.`,
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error, operationName);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      // Require multiple successes to fully close the circuit
      if (this.successCount >= 3) {
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }

  private onFailure(error: Error, operationName?: string): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      logError(
        "API_ERROR",
        `Circuit breaker opened for ${operationName || "operation"} after ${this.failureCount} failures`,
        error,
        {
          failureThreshold: this.failureThreshold,
          resetTimeout: this.resetTimeout,
          operationName,
          circuitBreakerState: CircuitBreakerState.OPEN,
        },
      );
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount,
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }
}

export class RetryMechanism {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
    operationName?: string,
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      jitter = true,
      retryCondition = this.defaultRetryCondition,
      onRetry,
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if we should retry this error
        if (!retryCondition(lastError, attempt)) {
          break;
        }

        // Calculate delay with exponential backoff
        let delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay,
        );

        // Add jitter to prevent thundering herd
        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }

        // Log retry attempt
        logError(
          "API_ERROR",
          `Retrying ${operationName || "operation"} (attempt ${attempt + 1}/${maxRetries + 1})`,
          lastError,
          {
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            delay,
            operationName,
            retryAttempt: true,
          },
        );

        // Call retry callback if provided
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }

        // Wait before retrying
        await this.delay(delay);
      }
    }

    // All retries exhausted
    logError(
      "API_ERROR",
      `All retry attempts exhausted for ${operationName || "operation"}`,
      lastError!,
      {
        maxRetries: maxRetries + 1,
        operationName,
        retryExhausted: true,
      },
    );

    throw new Error(lastError!.message);
  }

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitBreakerKey: string,
    circuitBreakerOptions?: CircuitBreakerOptions,
    operationName?: string,
  ): Promise<T> {
    let circuitBreaker = this.circuitBreakers.get(circuitBreakerKey);

    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker(circuitBreakerOptions);
      this.circuitBreakers.set(circuitBreakerKey, circuitBreaker);
    }

    return circuitBreaker.execute(operation, operationName);
  }

  async executeWithRetryAndCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitBreakerKey: string,
    retryOptions?: RetryOptions,
    circuitBreakerOptions?: CircuitBreakerOptions,
    operationName?: string,
  ): Promise<T> {
    return this.executeWithCircuitBreaker(
      () => this.executeWithRetry(operation, retryOptions, operationName),
      circuitBreakerKey,
      circuitBreakerOptions,
      operationName,
    );
  }

  private defaultRetryCondition(error: Error, _attempt: number): boolean {
    // Don't retry client errors (4xx) except for specific cases
    if (
      error.message.includes("400") ||
      error.message.includes("401") ||
      error.message.includes("403") ||
      error.message.includes("404")
    ) {
      return false;
    }

    // Retry on server errors (5xx), network errors, timeouts
    const retryableErrors = [
      "timeout",
      "network",
      "fetch",
      "500",
      "502",
      "503",
      "504",
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "AbortError",
      "CONNECTION_ERROR",
      "SERVICE_UNAVAILABLE",
    ];

    return retryableErrors.some(
      (errorType) =>
        error.message.toLowerCase().includes(errorType.toLowerCase()) ||
        error.name.toLowerCase().includes(errorType.toLowerCase()),
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getCircuitBreakerStats(key: string) {
    return this.circuitBreakers.get(key)?.getStats();
  }

  resetCircuitBreaker(key: string): void {
    this.circuitBreakers.get(key)?.reset();
  }

  getAllCircuitBreakerStats() {
    const stats: Record<string, any> = {};
    this.circuitBreakers.forEach((breaker, key) => {
      stats[key] = breaker.getStats();
    });
    return stats;
  }
}

// Global retry mechanism instance
export const globalRetryMechanism = new RetryMechanism();

// Convenience functions
export const retryOperation = <T>(
  operation: () => Promise<T>,
  options?: RetryOptions,
  operationName?: string,
) => globalRetryMechanism.executeWithRetry(operation, options, operationName);

export const retryWithCircuitBreaker = <T>(
  operation: () => Promise<T>,
  circuitBreakerKey: string,
  retryOptions?: RetryOptions,
  circuitBreakerOptions?: CircuitBreakerOptions,
  operationName?: string,
) =>
  globalRetryMechanism.executeWithRetryAndCircuitBreaker(
    operation,
    circuitBreakerKey,
    retryOptions,
    circuitBreakerOptions,
    operationName,
  );
