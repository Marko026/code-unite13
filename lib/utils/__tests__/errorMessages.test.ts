import { describe, expect, it } from "@jest/globals";
import {
  ERROR_MESSAGES,
  formatErrorForUser,
  getErrorMessage,
  getErrorMessageFromError,
  getRetryDelayForError,
  shouldRetryError,
} from "../errorMessages";

describe("errorMessages", () => {
  describe("getErrorMessage", () => {
    it("should return correct error message for known error code", () => {
      const result = getErrorMessage("NETWORK_ERROR");
      expect(result).toEqual(ERROR_MESSAGES.NETWORK_ERROR);
    });

    it("should return unknown error for invalid error code", () => {
      const result = getErrorMessage("INVALID_CODE");
      expect(result).toEqual(ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it("should use custom message when provided", () => {
      const customMessage = "Custom error message";
      const result = getErrorMessage("NETWORK_ERROR", customMessage);
      expect(result.message).toBe(customMessage);
      expect(result.title).toBe(ERROR_MESSAGES.NETWORK_ERROR.title);
    });
  });

  describe("getErrorMessageFromError", () => {
    it("should detect timeout errors", () => {
      const timeoutError = new Error("Request timeout");
      const result = getErrorMessageFromError(timeoutError);
      expect(result).toEqual(ERROR_MESSAGES.TIMEOUT);
    });

    it("should detect AbortError as timeout", () => {
      const abortError = new Error("Operation aborted");
      abortError.name = "AbortError";
      const result = getErrorMessageFromError(abortError);
      expect(result).toEqual(ERROR_MESSAGES.TIMEOUT);
    });

    it("should detect network errors", () => {
      const networkError = new Error("Network connection failed");
      const result = getErrorMessageFromError(networkError);
      expect(result).toEqual(ERROR_MESSAGES.NETWORK_ERROR);
    });

    it("should detect CORS errors", () => {
      const corsError = new Error("CORS policy violation");
      const result = getErrorMessageFromError(corsError);
      expect(result).toEqual(ERROR_MESSAGES.CORS_ERROR);
    });

    it("should detect quota exceeded errors", () => {
      const quotaError = new Error("Quota exceeded for requests");
      const result = getErrorMessageFromError(quotaError);
      expect(result).toEqual(ERROR_MESSAGES.QUOTA_EXCEEDED);
    });

    it("should detect API key errors", () => {
      const apiKeyError = new Error("Invalid API key provided");
      const result = getErrorMessageFromError(apiKeyError);
      expect(result).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it("should detect service unavailable errors", () => {
      const serviceError = new Error("Service unavailable - 503");
      const result = getErrorMessageFromError(serviceError);
      expect(result).toEqual(ERROR_MESSAGES.SERVICE_UNAVAILABLE);
    });

    it("should detect validation errors", () => {
      const validationError = new Error("Validation failed for input");
      const result = getErrorMessageFromError(validationError);
      expect(result).toEqual(ERROR_MESSAGES.VALIDATION_ERROR);
    });

    it("should detect JSON errors", () => {
      const jsonError = new Error("Invalid JSON format");
      const result = getErrorMessageFromError(jsonError);
      expect(result).toEqual(ERROR_MESSAGES.INVALID_JSON);
    });

    it("should detect circuit breaker errors", () => {
      const circuitError = new Error("Circuit breaker is OPEN");
      const result = getErrorMessageFromError(circuitError);
      expect(result).toEqual(ERROR_MESSAGES.CIRCUIT_BREAKER_OPEN);
    });

    it("should detect TinyMCE quota errors", () => {
      const tinyMCEError = new Error("TinyMCE quota exceeded");
      const result = getErrorMessageFromError(tinyMCEError);
      expect(result).toEqual(ERROR_MESSAGES.TINYMCE_QUOTA_EXCEEDED);
    });

    it("should detect TinyMCE general errors", () => {
      const tinyMCEError = new Error("TinyMCE initialization failed");
      const result = getErrorMessageFromError(tinyMCEError);
      expect(result).toEqual(ERROR_MESSAGES.TINYMCE_INIT_ERROR);
    });

    it("should detect HTTP 5xx errors", () => {
      const serverError = new Error("HTTP 500 Internal Server Error");
      const result = getErrorMessageFromError(serverError);
      expect(result).toEqual(ERROR_MESSAGES.INTERNAL_ERROR);
    });

    it("should return unknown error for unrecognized errors", () => {
      const unknownError = new Error("Some random error");
      const result = getErrorMessageFromError(unknownError);
      expect(result).toEqual(ERROR_MESSAGES.UNKNOWN_ERROR);
    });
  });

  describe("formatErrorForUser", () => {
    it("should format error with all properties", () => {
      const error = new Error("Network connection failed");
      const result = formatErrorForUser(error);

      expect(result).toEqual({
        title: "Connection Problem",
        message:
          "Unable to connect to the server. Please check your internet connection.",
        actionable: "Try refreshing the page or check your network connection.",
        canRetry: true,
        severity: "medium",
      });
    });

    it("should include context in message when provided", () => {
      const error = new Error("Network connection failed");
      const context = "API call to /api/chatgpt";
      const result = formatErrorForUser(error, context);

      expect(result.message).toBe(
        "API call to /api/chatgpt: Unable to connect to the server. Please check your internet connection.",
      );
    });

    it("should handle non-retryable errors", () => {
      const error = new Error("Invalid API key provided");
      const result = formatErrorForUser(error);

      expect(result.canRetry).toBe(false);
      expect(result.severity).toBe("critical");
    });
  });

  describe("shouldRetryError", () => {
    it("should return true for retryable errors", () => {
      const networkError = new Error("Network connection failed");
      expect(shouldRetryError(networkError)).toBe(true);

      const timeoutError = new Error("Request timeout");
      expect(shouldRetryError(timeoutError)).toBe(true);

      const serverError = new Error("HTTP 500 Internal Server Error");
      expect(shouldRetryError(serverError)).toBe(true);
    });

    it("should return false for non-retryable errors", () => {
      const apiKeyError = new Error("Invalid API key provided");
      expect(shouldRetryError(apiKeyError)).toBe(false);

      const validationError = new Error("Validation failed for input");
      expect(shouldRetryError(validationError)).toBe(false);

      const corsError = new Error("CORS policy violation");
      expect(shouldRetryError(corsError)).toBe(false);
    });
  });

  describe("getRetryDelayForError", () => {
    it("should return longer delays for quota errors", () => {
      const quotaError = new Error("Quota exceeded for requests");
      const delay1 = getRetryDelayForError(quotaError, 0);
      const delay2 = getRetryDelayForError(quotaError, 1);

      expect(delay1).toBe(5000); // 5 seconds
      expect(delay2).toBe(10000); // 10 seconds
      expect(delay2).toBeGreaterThan(delay1);
    });

    it("should return shorter delays for network errors", () => {
      const networkError = new Error("Network connection failed");
      const delay1 = getRetryDelayForError(networkError, 0);
      const delay2 = getRetryDelayForError(networkError, 1);

      expect(delay1).toBe(1000); // 1 second
      expect(delay2).toBe(1500); // 1.5 seconds
      expect(delay2).toBeGreaterThan(delay1);
    });

    it("should cap delays at maximum values", () => {
      const quotaError = new Error("Quota exceeded for requests");
      const networkError = new Error("Network connection failed");
      const genericError = new Error("Some error");

      // Test quota error max (60 seconds)
      const quotaDelay = getRetryDelayForError(quotaError, 10);
      expect(quotaDelay).toBe(60000);

      // Test network error max (10 seconds)
      const networkDelay = getRetryDelayForError(networkError, 10);
      expect(networkDelay).toBe(10000);

      // Test generic error max (30 seconds)
      const genericDelay = getRetryDelayForError(genericError, 10);
      expect(genericDelay).toBe(30000);
    });

    it("should use default exponential backoff for unknown errors", () => {
      const unknownError = new Error("Some random error");
      const delay1 = getRetryDelayForError(unknownError, 0);
      const delay2 = getRetryDelayForError(unknownError, 1);
      const delay3 = getRetryDelayForError(unknownError, 2);

      expect(delay1).toBe(1000); // 1 second
      expect(delay2).toBe(2000); // 2 seconds
      expect(delay3).toBe(4000); // 4 seconds
    });
  });

  describe("ERROR_MESSAGES configuration", () => {
    it("should have all required properties for each error type", () => {
      Object.entries(ERROR_MESSAGES).forEach(([key, config]) => {
        expect(config).toHaveProperty("title");
        expect(config).toHaveProperty("message");
        expect(config).toHaveProperty("severity");
        expect(config.title).toBeTruthy();
        expect(config.message).toBeTruthy();
        expect(["low", "medium", "high", "critical"]).toContain(
          config.severity,
        );

        if (config.retryable !== undefined) {
          expect(typeof config.retryable).toBe("boolean");
        }
      });
    });

    it("should have consistent retryable flags", () => {
      // Network errors should be retryable
      expect(ERROR_MESSAGES.NETWORK_ERROR.retryable).toBe(true);
      expect(ERROR_MESSAGES.TIMEOUT.retryable).toBe(true);
      expect(ERROR_MESSAGES.CONNECTION_ERROR.retryable).toBe(true);

      // Authentication/authorization errors should not be retryable
      expect(ERROR_MESSAGES.INVALID_API_KEY.retryable).toBe(false);
      expect(ERROR_MESSAGES.CORS_ERROR.retryable).toBe(false);

      // Validation errors should not be retryable
      expect(ERROR_MESSAGES.VALIDATION_ERROR.retryable).toBe(false);
      expect(ERROR_MESSAGES.INVALID_JSON.retryable).toBe(false);
    });
  });
});
