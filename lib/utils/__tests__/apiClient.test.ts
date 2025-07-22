import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { chatGPTAPI } from "../apiClient";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("API Client - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("chatGPTAPI.generateAnswer", () => {
    it("should handle successful API response", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          reply: "AI generated response",
        }),
      } as Response);

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        success: true,
        reply: "AI generated response",
      });
    });

    it("should handle API error responses", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({
          success: false,
          error: "Server error",
        }),
      } as Response);

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Server error");
    });

    it("should handle network errors", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should handle timeout errors", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "AbortError";
      mockFetch.mockRejectedValue(timeoutError);

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(false);
      expect(result.error).toContain("timeout");
    });

    it("should handle CORS errors", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValue(new Error("CORS policy violation"));

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(false);
      expect(result.error).toContain("CORS");
    });

    it("should handle quota exceeded errors", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: "Quota exceeded",
          code: "QUOTA_EXCEEDED",
        }),
      } as Response);

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Quota exceeded");
    });

    it("should validate input parameters", async () => {
      const result = await chatGPTAPI.generateAnswer("");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Question is required");
    });

    it("should handle malformed JSON responses", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        redirected: false,
        type: "basic",
        url: "",
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        text: jest.fn(),
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as Response);

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid JSON");
    });

    it("should include proper headers in requests", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, reply: "Response" }),
      } as Response);

      await chatGPTAPI.generateAnswer("Test question");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/chatgpt",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ question: "Test question" }),
        }),
      );
    });
  });

  describe("Error Recovery", () => {
    it("should retry on retryable errors", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, reply: "Success after retry" }),
        } as Response);

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable errors", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: "Bad request",
          code: "VALIDATION_ERROR",
        }),
      } as Response);

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it("should handle circuit breaker open state", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValue(new Error("Circuit breaker is OPEN"));

      const result = await chatGPTAPI.generateAnswer("Test question");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Circuit breaker");
    });
  });
});
