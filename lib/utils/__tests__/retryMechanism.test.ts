import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  CircuitBreaker,
  CircuitBreakerState,
  RetryMechanism,
} from "../retryMechanism";

// Mock the error logger
jest.mock("../errorLogger", () => ({
  logError: jest.fn(),
}));

describe("RetryMechanism", () => {
  let retryMechanism: RetryMechanism;
  let mockOperation: jest.Mock;

  beforeEach(() => {
    retryMechanism = new RetryMechanism();
    mockOperation = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("executeWithRetry", () => {
    it("should succeed on first attempt", async () => {
      const expectedResult = "success";
      mockOperation.mockResolvedValue(expectedResult);

      const result = await retryMechanism.executeWithRetry(mockOperation);

      expect(result).toBe(expectedResult);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      const expectedResult = "success";
      mockOperation
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValue(expectedResult);

      const result = await retryMechanism.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 10, // Short delay for testing
      });

      expect(result).toBe(expectedResult);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it("should exhaust retries and throw last error", async () => {
      const error = new Error("Network error"); // Use retryable error
      mockOperation.mockRejectedValue(error);

      await expect(
        retryMechanism.executeWithRetry(mockOperation, {
          maxRetries: 2,
          baseDelay: 10,
        }),
      ).rejects.toThrow("Network error");

      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should not retry on non-retryable errors", async () => {
      const error = new Error("400 Bad Request");
      mockOperation.mockRejectedValue(error);

      await expect(
        retryMechanism.executeWithRetry(mockOperation, {
          maxRetries: 3,
          baseDelay: 10,
        }),
      ).rejects.toThrow("400 Bad Request");

      expect(mockOperation).toHaveBeenCalledTimes(1); // No retries
    });

    it("should call onRetry callback", async () => {
      const onRetry = jest.fn();
      const error = new Error("Network error");
      mockOperation.mockRejectedValueOnce(error).mockResolvedValue("success");

      await retryMechanism.executeWithRetry(mockOperation, {
        maxRetries: 2,
        baseDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledWith(error, 1);
    });

    it("should apply exponential backoff with jitter", async () => {
      const startTime = Date.now();
      mockOperation
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue("success");

      await retryMechanism.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 100,
        backoffMultiplier: 2,
        jitter: false, // Disable jitter for predictable timing
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have waited at least 100ms + 200ms = 300ms
      expect(duration).toBeGreaterThanOrEqual(250); // Allow some tolerance
    });
  });

  describe("CircuitBreaker", () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });
    });

    it("should start in CLOSED state", () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it("should open after failure threshold is reached", async () => {
      const error = new Error("Service error");
      mockOperation.mockRejectedValue(error);

      // Trigger failures to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (e) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it("should reject immediately when OPEN", async () => {
      const error = new Error("Service error");
      mockOperation.mockRejectedValue(error);

      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (e) {
          // Expected to fail
        }
      }

      // Should reject immediately without calling operation
      mockOperation.mockClear();

      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(
        "Circuit breaker is OPEN",
      );

      expect(mockOperation).not.toHaveBeenCalled();
    });

    it("should transition to HALF_OPEN after reset timeout", async () => {
      const error = new Error("Service error");
      mockOperation.mockRejectedValue(error);

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (e) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Wait for reset timeout (using fake timers would be better in real tests)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      mockOperation.mockResolvedValue("success");
      await circuitBreaker.execute(mockOperation);

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it("should close after successful operations in HALF_OPEN", async () => {
      const error = new Error("Service error");
      mockOperation.mockRejectedValue(error);

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (e) {
          // Expected to fail
        }
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Succeed multiple times to close circuit
      mockOperation.mockResolvedValue("success");

      await circuitBreaker.execute(mockOperation); // HALF_OPEN
      await circuitBreaker.execute(mockOperation);
      await circuitBreaker.execute(mockOperation); // Should close after 3 successes

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it("should reset failure count on success", async () => {
      const error = new Error("Service error");

      // Fail twice (below threshold)
      mockOperation.mockRejectedValue(error);
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (e) {}
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (e) {}

      // Succeed once
      mockOperation.mockResolvedValue("success");
      await circuitBreaker.execute(mockOperation);

      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(0);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe("executeWithRetryAndCircuitBreaker", () => {
    it("should combine retry and circuit breaker functionality", async () => {
      const error = new Error("Network error");
      mockOperation
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue("success");

      const result = await retryMechanism.executeWithRetryAndCircuitBreaker(
        mockOperation,
        "test-circuit",
        {
          maxRetries: 3,
          baseDelay: 10,
        },
        {
          failureThreshold: 5,
          resetTimeout: 1000,
        },
      );

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it("should track circuit breaker stats", async () => {
      // First create a circuit breaker by using it
      mockOperation.mockResolvedValue("success");
      await retryMechanism.executeWithCircuitBreaker(
        mockOperation,
        "test-circuit",
      );

      const stats = retryMechanism.getCircuitBreakerStats("test-circuit");
      expect(stats).toBeDefined();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
    });

    it("should reset circuit breaker", async () => {
      // First create a circuit breaker by using it
      mockOperation.mockResolvedValue("success");
      await retryMechanism.executeWithCircuitBreaker(
        mockOperation,
        "test-circuit-reset",
      );

      retryMechanism.resetCircuitBreaker("test-circuit-reset");
      const stats = retryMechanism.getCircuitBreakerStats("test-circuit-reset");
      expect(stats.failureCount).toBe(0);
    });
  });
});
