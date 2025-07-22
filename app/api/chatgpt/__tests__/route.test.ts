import { jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET, OPTIONS, POST } from "../route";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("ChatGPT API Route - CORS Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.OPENAI_API_KEY;
  });

  describe("OPTIONS handler", () => {
    it("should return CORS headers for preflight requests", async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type, Authorization",
      );
      expect(response.headers.get("Access-Control-Max-Age")).toBe("86400");
    });
  });

  describe("POST handler - CORS headers", () => {
    it("should include CORS headers in successful responses", async () => {
      process.env.OPENAI_API_KEY = "test-api-key";

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Test response" } }],
        }),
      } as Response);

      const request = new NextRequest("http://localhost:3000/api/chatgpt", {
        method: "POST",
        body: JSON.stringify({ question: "Test question" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(data.success).toBe(true);
      expect(data.reply).toBe("Test response");
    });

    it("should include CORS headers in error responses", async () => {
      const request = new NextRequest("http://localhost:3000/api/chatgpt", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });

  describe("GET handler", () => {
    it("should return method not allowed with CORS headers", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(data.success).toBe(false);
      expect(data.error).toBe("Method not allowed");
      expect(data.code).toBe("METHOD_NOT_ALLOWED");
    });
  });
});

describe("ChatGPT API Route - Request Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-api-key";
  });

  it("should validate JSON request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: "invalid json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid JSON in request body");
    expect(data.code).toBe("INVALID_JSON");
  });

  it("should validate required question field", async () => {
    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid request data");
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("should validate question length limits", async () => {
    const longQuestion = "x".repeat(2001); // Exceeds 2000 char limit

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: longQuestion }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid request data");
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("should accept valid question", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Test response" } }],
      }),
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Valid question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("ChatGPT API Route - OpenAI Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle missing OpenAI API key", async () => {
    delete process.env.OPENAI_API_KEY;

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.error).toBe("AI service is not configured");
    expect(data.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("should handle OpenAI API quota exceeded error", async () => {
    process.env.OPENAI_API_KEY = "test-api-key";

    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          type: "insufficient_quota",
          message: "You exceeded your current quota",
        },
      }),
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("You exceeded your current quota");
    expect(data.code).toBe("QUOTA_EXCEEDED");
  });

  it("should handle OpenAI API invalid key error", async () => {
    process.env.OPENAI_API_KEY = "invalid-key";

    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          type: "invalid_api_key",
          message: "Invalid API key provided",
        },
      }),
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Invalid API key provided");
    expect(data.code).toBe("INVALID_API_KEY");
  });

  it("should handle OpenAI server errors", async () => {
    process.env.OPENAI_API_KEY = "test-api-key";

    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: { message: "Internal server error" },
      }),
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Internal server error");
    expect(data.code).toBe("OPENAI_ERROR");
  });

  it("should handle successful OpenAI response", async () => {
    process.env.OPENAI_API_KEY = "test-api-key";

    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "AI generated response" } }],
      }),
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reply).toBe("AI generated response");
  });

  it("should handle empty OpenAI response", async () => {
    process.env.OPENAI_API_KEY = "test-api-key";

    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.success).toBe(false);
    expect(data.error).toBe("No response from AI service");
    expect(data.code).toBe("NO_RESPONSE");
  });
});

describe("ChatGPT API Route - Network Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-api-key";
  });

  it("should handle network timeout errors", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    const timeoutError = new Error("Request timeout");
    timeoutError.name = "AbortError";
    mockFetch.mockRejectedValue(timeoutError);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(408);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Request timeout");
    expect(data.code).toBe("TIMEOUT");
  });

  it("should handle connection refused errors", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    const connectionError = new Error("Connection refused");
    (connectionError as any).code = "ECONNREFUSED";
    mockFetch.mockRejectedValue(connectionError);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unable to connect to AI service");
    expect(data.code).toBe("CONNECTION_ERROR");
  });

  it("should handle DNS resolution errors", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    const dnsError = new Error("DNS resolution failed");
    (dnsError as any).code = "ENOTFOUND";
    mockFetch.mockRejectedValue(dnsError);

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unable to connect to AI service");
    expect(data.code).toBe("CONNECTION_ERROR");
  });

  it("should handle generic internal errors", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValue(new Error("Unexpected error"));

    const request = new NextRequest("http://localhost:3000/api/chatgpt", {
      method: "POST",
      body: JSON.stringify({ question: "Test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Internal server error");
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
