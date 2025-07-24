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
  "Access-Control-Allow-Origin": process.env.NODE_ENV === 'production' 
    ? "https://code-unite13.vercel.app" 
    : "*",
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

    // Check for API keys (try Groq first, fallback to OpenAI)
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!groqKey && !openaiKey) {
      console.error("No AI API key is configured");
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

    // Use Groq if available (faster and free), otherwise OpenAI
    const useGroq = !!groqKey;
    const apiUrl = useGroq 
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    
    const apiKey = useGroq ? groqKey : openaiKey;
    const model = useGroq ? "llama-3.1-8b-instant" : "gpt-3.5-turbo";

    // Call AI API
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
        `AI API Error (${aiResponse.status}):`,
        errorMessage,
        `Using ${useGroq ? 'Groq' : 'OpenAI'}`
      );

      return NextResponse.json(
        {
          success: false,
          error: `AI service error: ${errorMessage}`,
          code: errorCode,
        },
        {
          status: aiResponse.status >= 500 ? 503 : 400,
          headers: corsHeaders,
        },
      );
    }

    const responseData = await aiResponse.json();

    if (!responseData.choices || !responseData.choices[0]) {
      console.error("No response from AI service:", responseData);
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
