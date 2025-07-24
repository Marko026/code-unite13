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

// CORS headers configuration - allow all Vercel domains
const getAllowedOrigin = (request: NextRequest) => {
  const origin = request.headers.get('origin');

  // Allow localhost for development
  if (origin?.includes('localhost')) return origin;

  // Allow all Vercel app domains
  if (origin?.includes('vercel.app')) return origin;

  // Allow your main domain
  if (origin?.includes('code-unite13.vercel.app')) return origin;

  return "*";
};

const getCorsHeaders = (request: NextRequest) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(request),
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
});

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

// Main POST handler
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ChatGPTResponse>> {
  const corsHeaders = getCorsHeaders(request);

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

    // Check for Groq API key
    const groqKey = process.env.GROQ_API_KEY;

    // Enhanced debug logging for production
    console.log("=== GROQ API DEBUG INFO ===");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Has Groq Key:", !!groqKey);
    console.log("Groq Key Length:", groqKey ? groqKey.length : 0);
    console.log("Groq Key Prefix:", groqKey ? groqKey.substring(0, 10) + "..." : "undefined");
    console.log("All Environment Variables:", Object.keys(process.env).filter(key => key.includes('GROQ')));
    console.log("Request Origin:", request.headers.get('origin'));
    console.log("Request URL:", request.url);
    console.log("========================");

    if (!groqKey) {
      console.error("Groq API key is not configured");
      console.error("Environment check:", {
        NODE_ENV: process.env.NODE_ENV,
        hasGroqKey: !!process.env.GROQ_API_KEY
      });

      return NextResponse.json(
        {
          success: false,
          error: "AI service is not configured. Please add GROQ_API_KEY to environment variables.",
          code: "SERVICE_UNAVAILABLE",
        },
        {
          status: 503,
          headers: corsHeaders,
        },
      );
    }

    // Use Groq API
    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    const apiKey = groqKey;
    const model = "llama-3.1-8b-instant";

    // Call AI API
    console.log("=== MAKING GROQ API CALL ===");
    console.log("API URL:", apiUrl);
    console.log("Model:", model);
    console.log("Question length:", question.length);

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are a professional programming assistant for a developer Q&A platform. 

FORMATTING RULES:
- Write in a professional, conversational tone
- Use proper sentence case (not ALL CAPS)
- Keep paragraphs concise (2-3 sentences max)
- Use bullet points for lists, not excessive line breaks
- Include code examples when relevant
- Be direct and helpful without being overly verbose

RESPONSE STRUCTURE:
- Start with a brief, direct answer
- Provide explanation if needed
- Include code example if applicable
- End with any additional tips or considerations

Keep responses focused and well-formatted for web display.`
          },
          { role: "user", content: question },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    console.log("Groq API Response Status:", aiResponse.status);
    console.log("Groq API Response Headers:", Object.fromEntries(aiResponse.headers.entries()));
    console.log("========================");

    if (!aiResponse.ok) {
      let errorMessage = "Unknown error";
      let errorCode = "AI_ERROR";

      try {
        const errorData = await aiResponse.json();
        errorMessage = errorData.error?.message || errorMessage;

        // Map specific error types
        if (errorData.error?.type === "insufficient_quota" || aiResponse.status === 429) {
          errorCode = "QUOTA_EXCEEDED";
        } else if (errorData.error?.type === "invalid_api_key" || aiResponse.status === 401) {
          errorCode = "INVALID_API_KEY";
        }
      } catch (parseError) {
        console.error("Failed to parse AI error response:", parseError);
      }

      console.error(
        `Groq API Error (${aiResponse.status}):`,
        errorMessage
      );

      return NextResponse.json(
        {
          success: false,
          error: `Groq API error: ${errorMessage}`,
          code: errorCode,
        },
        {
          status: aiResponse.status >= 500 ? 503 : 400,
          headers: corsHeaders,
        },
      );
    }

    const responseData = await aiResponse.json();

    console.log("=== GROQ API RESPONSE ===");
    console.log("Full response:", JSON.stringify(responseData, null, 2));
    console.log("Response keys:", Object.keys(responseData));
    console.log("Has choices:", !!responseData.choices);
    console.log("Choices length:", responseData.choices?.length);
    console.log("========================");

    if (!responseData.choices || !responseData.choices[0]) {
      console.error("No response from Groq API:", responseData);
      return NextResponse.json(
        {
          success: false,
          error: "No response from Groq API",
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
    console.error("Groq API Route Error:", error);

    // Handle specific error types
    let errorMessage = "Internal server error";
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";

    if (error.name === "AbortError") {
      errorMessage = "Request timeout";
      statusCode = 408;
      errorCode = "TIMEOUT";
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage = "Unable to connect to Groq API";
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
export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

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
