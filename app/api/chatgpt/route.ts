import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request validation schema
const ChatGPTRequestSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(2000, "Question is too long"),
});

// Response interfaces
interface ChatGPTResponse {
  success: boolean;
  reply?: string;
  error?: string;
  code?: string;
}

// CORS headers configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // In production, replace with specific domain
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Main POST handler
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ChatGPTResponse>> {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Validate request data
    const validationResult = ChatGPTRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          code: "VALIDATION_ERROR",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const { question } = validationResult.data;

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured");
      return NextResponse.json(
        {
          success: false,
          error: "AI service is not configured",
          code: "SERVICE_UNAVAILABLE",
        },
        {
          status: 503,
          headers: corsHeaders,
        },
      );
    }

    // Call OpenAI API
    const openAIResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: question },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      },
    );

    if (!openAIResponse.ok) {
      let errorMessage = "Unknown error";
      let errorCode = "OPENAI_ERROR";

      try {
        const errorData = await openAIResponse.json();
        errorMessage = errorData.error?.message || errorMessage;

        // Map specific OpenAI error types
        if (errorData.error?.type === "insufficient_quota") {
          errorCode = "QUOTA_EXCEEDED";
        } else if (errorData.error?.type === "invalid_api_key") {
          errorCode = "INVALID_API_KEY";
        }
      } catch (parseError) {
        console.error("Failed to parse OpenAI error response:", parseError);
      }

      console.error(
        `OpenAI API Error (${openAIResponse.status}):`,
        errorMessage,
      );

      return NextResponse.json(
        {
          success: false,
          error: `AI service error: ${errorMessage}`,
          code: errorCode,
        },
        {
          status: openAIResponse.status >= 500 ? 503 : 400,
          headers: corsHeaders,
        },
      );
    }

    const responseData = await openAIResponse.json();

    if (!responseData.choices || !responseData.choices[0]) {
      console.error("No response from OpenAI:", responseData);
      return NextResponse.json(
        {
          success: false,
          error: "No response from AI service",
          code: "NO_RESPONSE",
        },
        {
          status: 502,
          headers: corsHeaders,
        },
      );
    }

    const reply = responseData.choices[0].message.content;

    return NextResponse.json(
      {
        success: true,
        reply,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error: any) {
    console.error("ChatGPT API Route Error:", error);

    // Handle specific error types
    let errorMessage = "Internal server error";
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";

    if (error.name === "AbortError") {
      errorMessage = "Request timeout";
      statusCode = 408;
      errorCode = "TIMEOUT";
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage = "Unable to connect to AI service";
      statusCode = 503;
      errorCode = "CONNECTION_ERROR";
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
      },
      {
        status: statusCode,
        headers: corsHeaders,
      },
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    {
      status: 405,
      headers: corsHeaders,
    },
  );
}
